# Content-defined chunking with Rabin fingerprinting

## What is Content-defined chunking?

Content-defined chunking (CDC) splits a byte stream into variable-sized pieces using content-sensitive boundaries (for example, when a rolling fingerprint matches a pattern), not at fixed offsets. After a small edit in the middle of a file, chunks before and after the edit often stay identical, which makes deduplicated storage and efficient deltas practical.

## Why not fixed-size chunks?

With **fixed-size** blocks, inserting or deleting bytes shifts everything after the edit, so almost every block can change even when most of the file is the same.

**Example.** Original text:

```text
The quick brown fox jumps over the lazy dog.
```

After changing `brown fox` to `black cat`:

```text
The quick black cat jumps over the lazy dog.
```

With CDC, chunks are defined by content, so regions that are still byte-for-byte identical before and after the edit (e.g. `The quick ` and tail segments, depending on boundaries) lead to the same chunk hashes. Only the chunks that actually cover the edited region (and sometimes a short tail) are updated. Fixed blocking would force many more blocks to differ because positions moved.

## What Rabin fingerprinting does here

Bytes are treated as coefficients of a polynomial `P(x)`; the fingerprint is something like `P(x) mod M`. As you slide a window one byte at a time, you update that value in **O(1)** instead of re-hashing the whole window each time.

**Polynomial (compact notation).** For bytes `s[0] … s[n-1]`:

`P(x) = s[0]·x^(n−1) + s[1]·x^(n−2) + … + s[n-1]`, fingerprint = `P(x) mod M`.

**Rolling step** for window length *k*: if

`H = s[0]·x^(k−1) + … + s[k-1]`,

then after shifting (drop `s[0]`, add `s[k]`):

`H' = ((H − s[0]·x^(k−1)) · x + s[k]) mod M`

(with `x^(k−1) mod M` precomputed). 


**Tiny numeric illustration** of `P(x) mod M`: for `"abc"` ( with codes 97, 98, 99 ), base 256, modulus 101:

`hash = (97·256² + 98·256 + 99) mod 101`
## From fingerprint to chunk boundaries

The key idea: **We want to split the data into chunks that are, on average, a target size (let’s call this `targetAvgChunkSize`)**. To achieve this, we look for chunk boundaries as we scan the file using a rolling hash (fingerprint).

### Step 1: Setting the Boundary Probability

We want a boundary, *on average*, every `targetAvgChunkSize` bytes. That means:

- **Probability(boundary at any byte) = 1 / targetAvgChunkSize**

If our rolling fingerprint is *uniformly distributed*, we can use the following property:
- **P(fingerprint mod targetAvgChunkSize == 0) = 1 / targetAvgChunkSize**

This is only true if our fingerprint is random enough—which is a core assumption:
> **Rabin fingerprinting** is well-suited because its hash values (for random polynomial mod a prime) approximate uniformly random outputs.

### Step 2: The Boundary Condition

As you scan the byte stream, slide the rolling hash window one byte at a time. At each step:

**Boundary condition:** `fingerprint mod targetAvgChunkSize == 0`

To optimize performance (since modulo is slow for non-powers of two), we typically choose `targetAvgChunkSize` as a power of two.  This lets us use a *bitmask* rather than a modulo operation (Read below).

### Step 3: Using a Bitmask for Efficient Boundary Detection

`targetAvgChunkSize = 2^k` for some k,
We know the probability of a random sequence of k bits being a given value (e.g., all zeros, all ones, or a specific pattern) is `1 / 2^k`.
We can use this to create a mask that will be used to check if the lower k bits are 0. 
- `mask = (1 << k) - 1`  (this is a number with k lower bits set to 1)
     - For example: `targetAvgChunkSize = 4096` bytes → `k = 12`, so `mask = 0b111111111111` (twelve ones).

- **Boundary Condition with a Mask:** (fingerprint & mask) == 0

**Sample Java Implementation:**
```java
int bits = Integer.numberOfTrailingZeros(
               Integer.highestOneBit(avgChunkSize)
           );
this.mask = (1L << bits) - 1L;
```

## Heuristics

### Chunk Size 

To ensure chunks are not too small or too large, apply these rules as you scan:

```text
if current_chunk_size < min → keep reading
else if (fingerprint & mask) == 0 → cut
else if current_chunk_size > max → force cut
```

This gives variable-sized chunks, with each chunk averaging `targetAvgChunkSize`, but bounded by your min and max limits.

### Stability

In Rabin fingerprinting, the rolling hash is computed over a sliding window of W bytes.

```text
If window is too small Lower bits are not well distributed
Our assumption that P(boundary)=1/2^k breaks
```

```text
If window is too large Lower bits are well distributed, but impact of a changed bit propogates further

Context: In a window of size W, upon inserting a byte at an arbitrary position, only hashes within next W positions are affected. After that, the hash realigns.
```

## Recommended starter knobs

```
window = 48 or 64  
avgChunkSize = 8KB → mask bits = 13  
min = 2KB  
max = 64KB
```

## Rabin value is not chunk identity

After a cut, hash the chunk bytes (SHA-256 or similar) for lookup and storage.

|            | Rabin-style rolling fingerprint | Strong hash (e.g. SHA-256)          |
| ---------- | ------------------------------- | ----------------------------------- |
| Job        | Decide where to cut             | Name the chunk; dedup and integrity |
## Java Implementation of Chunking with Rabin Fingerprinting

```java
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;

public final class CdcChunker {
    private final int minChunk;
    private final int maxChunk;
    private final int windowSize;
    private final long mask;
    private static final long BASE = 257L;

    public CdcChunker(int minChunk, int avgChunk, int maxChunk, int windowSize) {
        if (!(minChunk > 0 && minChunk <= avgChunk && avgChunk <= maxChunk && windowSize > 0)) {
            throw new IllegalArgumentException("invalid sizes");
        }
        this.minChunk = minChunk;
        this.maxChunk = maxChunk;
        this.windowSize = windowSize;
        int bits = Integer.numberOfTrailingZeros(Integer.highestOneBit(avgChunk));
        this.mask = (1L << bits) - 1L;
    }

    public List<Chunk> chunk(InputStream in) throws IOException {
        List<Chunk> out = new ArrayList<>();
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        ArrayDeque<Byte> win = new ArrayDeque<>(windowSize);
        long roll = 0L;
        long pow = 1L;
        for (int i = 0; i < windowSize - 1; i++) {
            pow *= BASE;
        }
        int b;
        while ((b = in.read()) >= 0) {
            byte x = (byte) b;
            buf.write(x);
            if (win.size() < windowSize) {
                win.addLast(x);
                roll = roll * BASE + (x & 0xFF);
            } else {
                byte left = win.removeFirst();
                win.addLast(x);
                roll -= (long) (left & 0xFF) * pow;
                roll = roll * BASE + (x & 0xFF);
            }
            int n = buf.size();
            boolean canCut = n >= minChunk;
            boolean boundary = canCut && win.size() == windowSize && (roll & mask) == 0;
            boolean force = n >= maxChunk;
            if (boundary || force) {
                flush(out, buf);
                win.clear();
                roll = 0L;
            }
        }
        if (buf.size() > 0) {
            flush(out, buf);
        }
        return out;
    }

    private static void flush(List<Chunk> out, ByteArrayOutputStream buf) {
        byte[] data = buf.toByteArray();
        out.add(new Chunk(data, Hashing.sha256Hex(data)));
        buf.reset();
    }
}
```
## Summary

**CDC with Rabin fingerprinting:** maintain a rolling fingerprint, cut when your rule fires (plus min/max sizes), then **identify** each chunk by a **cryptographic hash** of its bytes. That separates “where to split” from “what object to store,” which is what delta sync builds on.

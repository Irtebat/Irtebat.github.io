---
sidebar_position: 0
---


# Protobuf Encoding

## What is Protobuf?

Protocol Buffers (Protobuf) is a **binary serialization format** created by Google.

- **Serialization** — taking an in-memory object (user, order, event …) and turning it into bytes so it can be stored or sent over the network.
- **Deserialization** — taking those bytes and reconstructing the object.

### First-principles view

Suppose you want to send this data:

```json
{
  "id": 150,
  "name": "Ira",
  "active": true
}
```

A computer does not care that the key is spelled `"name"` or that braces and commas exist. Those are useful for humans — for machines, all of that is overhead.

Protobuf says: *both sides already agree on the schema*, so we do not need to send field names. We can send only:

- which **field** this is
- what **type** it has
- what **value** it contains

Instead of sending full text keys every time, Protobuf sends compact binary data based on a predefined schema.

### Schema example

```protobuf
message User {
  int32  id     = 1;
  string name   = 2;
  bool   active = 3;
}
```

- Field **1** is `id`, type `int32`
- Field **2** is `name`, type `string`
- Field **3** is `active`, type `bool`

The wire format mainly cares about the **field numbers** (1, 2, 3), not the field names. 

## When and Why Protobuf Is Used over JSON and Avro

### Protobuf vs JSON

**Use Protobuf when you care about:**

- Lower network bandwidth
- Faster serialization / deserialization
- Strong schemas
- Compatibility across services
- Language-neutral code generation
- Efficient RPC systems such as gRPC

**Use JSON when you care about:**

- Human readability
- Quick debugging in logs or APIs
- Loose or dynamic structure
- Browser-native interoperability
- Simplicity for public APIs

#### First-principles comparison

JSON sends **both data and description**. Every message re-sends `"id"`, `"name"`, `"active"`:

```json
{"id":150,"name":"Ira","active":true}
```

Protobuf sends **mostly just data**. Both producer and consumer already know the schema, so the message can just say:

```
field 1 → 150
field 2 → "Ira"
field 3 → true
```

The trade-off: not human-readable by default, you need the schema to interpret it, and debugging raw bytes is harder.

### Protobuf vs Avro

Both are compact, binary, and schema-based — so they are closer than either is to JSON.

**Protobuf is often preferred when:**

- You want generated classes in many languages
- You want very explicit field numbering and evolution rules
- You are building service-to-service communication
- You use gRPC
- You want a mature, strongly typed developer workflow

**Avro is often preferred when:**

- You are in data pipelines (Hadoop / Kafka ecosystems)
- You want writer-schema + reader-schema resolution
- You care about schema evolution at the data-platform level
- You use tools where Avro is a native fit

#### First-principles difference

| Aspect | Protobuf | Avro |
|---|---|---|
| Optimized around | Application / service contracts | Data pipelines & schema evolution in storage/streaming |
| Field identity on the wire | Stable numeric tags | Schema order (field names not carried per record) |
| Unknown fields | Skipped by wire type | Resolved via reader/writer schema pair |

In simple terms:

- **JSON** — for humans
- **Protobuf** — for compact, typed service communication
- **Avro** — for data systems and schema-managed event pipelines

---

## How Does the Encoding Work?

### The wire format mental model

A Protobuf message is a sequence of:

```
[field tag + encoded value] [field tag + encoded value] …
```

Each field is encoded separately and carries:

1. A **field number**
2. A **wire type**
3. The actual **bytes of the value**

### Wire types

| Wire type | Meaning | Used for |
|---|---|---|
| 0 | Varint | `int32`, `int64`, `bool`, `enum` |
| 2 | Length-delimited | `string`, `bytes`, nested messages, `repeated` packed |
| 1 | 64-bit fixed | `fixed64`, `double` |
| 5 | 32-bit fixed | `fixed32`, `float` |

### The tag — field number + wire type

For each field, Protobuf combines number and wire type into a single small integer:

```
tag = (field_number << 3) | wire_type
```

When a parser reads a field it first reads the tag to learn **which field this is** and **how to parse the value**. This makes the message self-describing enough to parse, yet still compact.

### About Varints: how integers are encoded

Varint encoding stores integers using **fewer bytes for smaller values**:

- Each byte uses the lower **7 bits** for data and the highest bit as a **continuation flag** (`1` = more bytes follow, `0` = last byte).
- Least-significant group is written first.

Rough feel:

| Value | Bytes needed |
|---|---|
| 1 – 127 | 1 byte |
| 128 – 16 383 | 2 bytes |
| larger | more bytes |

Protobuf is especially efficient when many values are small — IDs, counters, enums, flags, booleans all encode nicely.

### Real example — step by step

**Schema:**

```protobuf
message User {
  int32  id     = 1;
  string name   = 2;
  bool   active = 3;
}
```

**Data:** `id = 150`, `name = "Ira"`, `active = true`

#### Field 1 — `id = 150`

| Step | Detail |
|---|---|
| Field number | 1 |
| Wire type | varint → 0 |
| Tag | `(1 << 3) \| 0 = 8` → `0x08` |
| Encode 150 as varint | 150 = `10010110` binary. Split into 7-bit groups (LSB first): `0010110`, `0000001`. Set continuation bit on non-final bytes → `0x96 0x01` |
| **Bytes** | `08 96 01` |

#### Field 2 — `name = "Ira"`

| Step | Detail |
|---|---|
| Field number | 2 |
| Wire type | length-delimited → 2 |
| Tag | `(2 << 3) \| 2 = 18` → `0x12` |
| String bytes | `"Ira"` in UTF-8 → `49 72 61` (3 bytes) |
| Length as varint | `0x03` |
| **Bytes** | `12 03 49 72 61` |

#### Field 3 — `active = true`

| Step | Detail |
|---|---|
| Field number | 3 |
| Wire type | varint → 0 |
| Tag | `(3 << 3) \| 0 = 24` → `0x18` |
| Value | `true` → varint `1` → `0x01` |
| **Bytes** | `18 01` |

#### Final encoded message

```
08 96 01 12 03 49 72 61 18 01
```

Visual breakdown:

```
08 | 96 01 | 12 | 03 | 49 72 61 | 18 | 01
 ^    ^       ^    ^    ^           ^    ^
tag  value   tag  len  "Ira"       tag  value

field 1       field 2              field 3
id = 150      name = "Ira"         active = true
```

### How a parser reads the stream

```
read tag  0x08 → field 1, varint
read varint 0x96 0x01 → 150

read tag  0x12 → field 2, length-delimited
read length 0x03 → 3 bytes
read bytes  0x49 0x72 0x61 → "Ira"

read tag  0x18 → field 3, varint
read varint 0x01 → true
```

Because every field includes enough information to parse itself, a decoder can **skip fields it does not understand** — this is the foundation of schema evolution.

---

## Schema Evolution — Forward and Backward Compatibility

Schema evolution is the ability to **change a schema over time** (add fields, remove fields, change types) while keeping producers and consumers that use different versions of the schema working together.

Protobuf's wire format was designed with this in mind: every field carries its own tag and wire type, so a parser can always skip unknown fields without breaking.

### Key definitions

| Term | Meaning |
|---|---|
| **Backward compatible** | A **new** reader can read data written by an **old** writer. "I can still understand the past." |
| **Forward compatible** | An **old** reader can read data written by a **new** writer. "I can still tolerate the future."|
| **Full compatible** | Both directions — new reads old *and* old reads new. |

### How Protobuf achieves this

Because each field on the wire is `(field_number, wire_type, value)`:

- An **old reader** that encounters an **unknown field number** can read the wire type, skip the appropriate number of bytes, and continue parsing. → **forward compatible**
- A **new reader** that does not find an **expected field** simply uses the **default value** for that type (zero, empty string, false, etc.). → **backward compatible**

### Safe changes (preserve both directions)

| Change | Why it's safe |
|---|---|
| **Add a new field** with a fresh field number | Old readers skip it (forward). New readers use the default when it's absent (backward). |
| **Remove a field** (stop writing it) | Old readers that still expect it get the default (forward for new writer). New readers that no longer expect it skip it if present (backward for old data). |
| **Mark a field as `reserved`** | Prevents future reuse of the field number/name, avoiding accidental collisions. |
| **Rename a field** | Field names are not on the wire — only numbers matter. |

### Unsafe / breaking changes

| Change | Why it breaks |
|---|---|
| **Reuse a field number** for a different type or meaning | Old data with that field number will be misinterpreted by a new reader. |
| **Change a field's wire type** (e.g. `int32` → `string`) | The parser expects a different encoding; decoding will fail or produce garbage. |

### The golden rule

> **Field numbers are forever.** Never reuse or reassign a field number once it has been used in production.

When retiring a field, use `reserved` to prevent accidental reuse:

```protobuf
message User {
  reserved 4;
  reserved "email";

  int32  id     = 1;
  string name   = 2;
  bool   active = 3;
  // field 4 ("email") was removed — do not reuse
}
```

### Practical examples

#### Adding a field (backward + forward compatible)

*Writer v2* adds an `email` field:

```protobuf
message User {
  int32  id     = 1;
  string name   = 2;
  bool   active = 3;
  string email  = 4;   // new
}
```

- **Old reader (v1)** receives a v2 message → sees tag for field 4, does not recognise it, reads wire type (length-delimited), skips the bytes. Works fine.
- **New reader (v2)** receives a v1 message → does not find field 4, uses default (`""`). Works fine.

#### Removing a field (backward + forward compatible if done correctly)

*Writer v3* stops writing `active`:

```protobuf
message User {
  reserved 3;
  reserved "active";

  int32  id    = 1;
  string name  = 2;
  string email = 4;
}
```

- **Old reader (v2)** receives a v3 message → does not find field 3, uses default (`false`). Works fine.
- **New reader (v3)** receives a v2 message → sees tag for field 3, skips it. Works fine.

### `optional` vs `required` and evolution

Proto3 made all scalar fields implicitly optional with default values, which greatly simplifies evolution:

- You can always add or drop a field without breaking the wire contract.
- Proto2's `required` keyword is **hostile to evolution** — if a required field is missing, parsing fails. This is why Proto3 removed it.

### Enums and evolution

When adding enum values, keep in mind:

- An old reader that receives an **unknown enum value** will store it as the numeric value (Proto3) or treat it as an unknown field (Proto2). It will **not** crash, but application logic that switches on enum names may fall through to a default case.
- Always include a **zero value** as an `UNKNOWN` or `UNSPECIFIED` sentinel — this is the default for enum fields.

```protobuf
enum Status {
  STATUS_UNSPECIFIED = 0;
  ACTIVE            = 1;
  INACTIVE          = 2;
  SUSPENDED         = 3;   // added later — safe
}
```

---
sidebar_position: 6
---
# Quadtree

A **quadtree** splits a 2D area into **4 quadrants** (NW, NE, SW, SE). Whenever a region holds too many points, it splits again into 4 smaller squares. This keeps **dense areas finely divided** and **empty areas coarse**, so "what is near here?" searches only look at the squares that matter.

*Examples:* spatial indexes (PostGIS SP-GiST), image compression, game collision detection

## What it is

The space is a tree where **every node has 4 children**. You start with one big square covering the whole area. When a square gets more than `N` points (its **capacity**), it **subdivides** into 4 equal sub-squares and pushes its points down.

- **Dense** regions (a busy city) → many small squares, deep tree.
- **Sparse** regions (open ocean) → few big squares, shallow tree.

**Example:** A map of stores. Downtown has 500 stores in one square, so it subdivides several levels deep. The desert outside town stays one big square with 2 stores.

## Where it is used

Real-world places quadtrees show up:

- **Maps / "near me" search** — find points inside a viewport or radius without scanning every point. (PostGIS SP-GiST, geospatial indexes)
- **Games & physics** — collision detection: only check objects that share a square instead of every pair (O(n²) → much less).
- **Image compression** — split an image into quadrants; uniform-color squares stop subdividing. (Used in some image and terrain formats.)
- **GIS / mapping tiles** — level-of-detail rendering, where zooming in loads finer squares.
- **Sparse data grids** — storing a mostly-empty 2D grid efficiently.

- **When:** You have many 2D points and ask "what is in this box / near this point?"
- **Good for:** Non-uniform data — clusters in some places, emptiness in others.
- **Watch out:** Very clustered points can make the tree very deep. Rebalancing on heavy inserts/deletes can be costly.

## My implementation

Placeholder link to my GitHub repo for the quadtree:

[github.com/Irtebat/indexes-from-scratch/tree/main/quad-tree](https://github.com/Irtebat/indexes-from-scratch/tree/main/quad-tree)

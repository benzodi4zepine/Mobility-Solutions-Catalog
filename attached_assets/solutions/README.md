# Solution photography

Product photos for catalog solutions live here, one or more per solution.

To add photos for a solution:

1. Drop the files in this folder, named after the solution's `imageKey`
   (e.g. `smart-knee-1.jpg`, `smart-knee-2.jpg`).
2. Import them in `artifacts/mobility-catalog/src/lib/solution-images.ts` and
   list them under that key. The first image is used on cards; the rest appear
   as a gallery on the solution's detail page.

Solutions without photos fall back to a placeholder labelled "photo pending",
so the layout stays intact and the gap is visible rather than silent.

`imageKey` values in use: smart-knee, carbon-foot, socket, bionic-hand,
digital-scan, passive-limb, spinal-brace, carbon-afo, kafo, insole,
diabetic-care.

Note on rights: manufacturer product imagery (Ottobock and similar) is
generally licensed to authorised distributors through their partner asset
packs. Confirm Mafaz holds the right to publish any manufacturer photo before
it goes live.

# GLR Code Quest v3.1.1

Positions B5.400A label beside the door, renames Kim Smit to Mvr. Smit, moves her to the lower-middle of B5.400A, and restores a permanently visible in-game reset button.

# GLR Code Quest v3.1.0

Adds Kim Smit (Onderwijsassistent) as a fifth NPC encounter in B5.400A, with custom four-direction sprites, portrait and a 3D-printer open-day challenge. Mr. Bijlsma becomes task 05 and unlocks after Kim and the other three preparations are complete.

# GLR Code Quest v3.0.0

Narrative rebuild: all four coding challenges, dialogues, previews, start screen, wayfinding copy, progress UI, completion messages and finale now form one coherent first-day/open-day story.

# GLR Code Quest v2.9.6

Teacher titles are now centrally defined and explicitly rendered in both dialogue and challenge UI.

# GLR Code Quest v2.9.5

Replaces room shell, wayfinding, projector screen and small GLR screen with the user-supplied improved assets. Dimensions match the previous assets exactly, so existing placement/collision remains intact.

# GLR Code Quest v2.9.4

Updates the displayed teacher job titles in dialogue and challenge UI.

# GLR Code Quest v2.9.3

Geometry/render fix: room-shell artifact removed, HUD relocated, sprite-aligned boundaries, furniture alignment, accessible empty rooms, corrected square head rooms and smoother environment rendering.

# GLR Code Quest v2.9.2

Corridor cleanup and room-front polish: hallway props removed, wayfinding moved to player start, classroom labels moved left of doors, cross icon removed from room shell art, clocks reduced, whiteboard removed, and student desks repositioned away from the door/wall zone.

# GLR Code Quest v2.9.1

Layout refinement: larger classrooms, smaller clocks, more space between projector screen and teacher desk, isolated stair and lift rooms, and empty Secretariaat/Docentenruimte.

# GLR Code Quest v2.9.0

Full visual rebuild using the approved generated pixel-art direction as actual game assets. Rooms now use authored room-shell sprites, furniture sprites, stairs/lifts/toilets use matching environment sprites, corridor props use the same art set, and the gameplay HUD now follows the approved reference composition.

# GLR Code Quest v2.8.0

Styling rebuild toward the approved visual target: brighter classroom architecture, green room signage, glass fronts, green doors, beige-tile corridor, props, improved service zones, and a corridor wayfinding board that visually matches the reference.

# GLR Code Quest v2.7.0

Rebuilds classroom visuals to match the approved top-down reference: light tiled floors, GLR-green trim, wall screens, teacher desks, eight student workstations, whiteboards, plants, cabinets and clocks. Old mismatched projector assets are replaced.

# GLR Code Quest v2.6.7

Adds a teacher desk and projector/screen to every non-corner classroom, scaled to match the existing player and smaller workstation furniture. Student desks remain at 8 per classroom.

# GLR Code Quest v2.6.6

Reduces workstation scale and places 8 desks per non-corner classroom, sized to better match the player sprite with compact collision footprints and usable walking space.

# GLR Code Quest v2.6.5

Adds workstation desk/computer furniture to all classrooms except the two corner/end rooms (B5.400A and B5.460). The new desks use the current top-down perspective and include light collision so players can walk around them.

# GLR Code Quest v2.6.4

Start screen refreshed to use GLR green consistently with improved readability and contrast.

# GLR Code Quest v2.6.3

Adds unique pixel-art dialogue/challenge portraits for all four teachers and standardizes branded UI accents to GLR green (#78C841).

# GLR Code Quest v2.6.2

Visual cleanup: removed green decorative blocks, converted magenta UI accents to GLR green, and shortened the final hallway segment so B5.450 and B5.460 sit closer together.

# GLR Code Quest v2.6.1

Visual cleanup: removed the BEWEGWIJZERING caption, male/female toilet symbols, and stair stripe details while preserving labels, lifts, collisions and interactive wayfinding.

# GLR Code Quest v2.5.0

Adds B5 wayfinding landmarks: a men's toilet opposite the Docentenruimte, a women's toilet opposite B5.440, and a visible lift in every stairwell. Service recess collision and hallway openings are updated accordingly.

# GLR Code Quest v2.4

Adds an RPG-style dialogue step before each coding challenge, with a portrait/headshot panel using a temporary placeholder asset.

# GLR Code Quest v2.3.0

B5 room sequence updated: B5.400A at the head, followed by B5.400B, B5.402A Secretariaat, Docentenruimte, B5.420-B5.450, and B5.460 at the opposite head. The hallway and exit positions were extended to preserve realistic spacing.

# GLR Code Quest v2.2.0

Level-geometry fix: contiguous classroom block, explicit door-only access, enclosed stair/lift recesses, sealed hallway boundaries, corrected head-room connections, and retained 8-direction player movement.

# GLR Code Quest v2.1.0

Updated player movement to use the new 8-direction sprite set (N, NE, E, SE, S, SW, W, NW) for idle, walking and sprinting.

# GLR Code Quest v2.0

New 3/4 top-down world renderer with a long scrolling B5 corridor, empty classrooms with actual door gaps and collision, head rooms B5.400/B5.460, camera follow, and retained challenges/player/teacher sprites.

# GLR Code Quest v1.8.1

Refined the B5 hallway layout with cleaner room boundaries, entrances, spacing and camera flow. Also fixes Mvr. Heinsdijk's upper-left facing direction by remapping the faulty northwest teacher sprite.

# GLR Code Quest v1.8.0

B5 layout correction: classrooms and stair/lift side swapped, classrooms have walk-through entrances, and B5.400/B5.460 are perpendicular head rooms at the two ends of the corridor.

# GLR Code Quest v1.7.0

Rebuilds B5 as a long scrollable hallway with realistic room/corridor proportions, corrected room numbering (B5.400 -> B5.460), and a follow camera.

# GLR Code Quest v1.6.0

Adds a first B5 hallway layout based on the provided photo: three left-side stair/lift exits, empty classrooms B5.410-B5.450 on the right, and end rooms B5.400 and B5.460. NPCs and challenges are preserved.

# GLR Code Quest v1.5.2

Fixes teacher sprite crop artifacts, updates NPC names, and keeps all NPCs on teacher sprites.

# GLR Code Quest v1.5.1

Fixes teacher NPC scale and uses teacher sprites for all four NPCs. NPCs face the player.

# GLR Code Quest v1.5

Nieuwe docenten-sprites voor Mila en Noor. Docenten staan stil en draaien automatisch in vier isometrische richtingen naar de speler.

# GLR Code Quest v1.4

Movement update: simultaneous WASD/arrow inputs are allowed, but movement always resolves to one of the four isometric directions. The most recently pressed direction wins.

# GLR Code Quest v1.3 — Isometric boundaries

De vloer en de twee achterliggende isometrische muren zijn terug, zonder meubels of extra sprites. De speler blijft binnen de grenzen van de isometrische vloer.

**Besturing:** één WASD- of pijlrichting tegelijk; twee richtingen tegelijk (zoals S+D) leveren geen beweging op. Shift + één richting sprint nog steeds. NPCs en programmeeropdrachten zijn ongewijzigd.

Start: `npm install && npm run dev`.

# GLR Code Quest v1.2 — Character Test Area

The environment artwork, tiled floors, objects, walls, room signage and furnishing are removed. The four NPCs, player, walk/run animations, dialogue and challenges remain. Smooth LINEAR texture filtering and high-DPI Phaser canvas rendering are enabled.

Install: `npm install` then `npm run dev`.

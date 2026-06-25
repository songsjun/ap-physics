<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## AP Physics Content Data Notes

- `data/content_library.json` targets College Board AP Physics 1 Fall 2024 CED topics `1.1` through `8.4`; `tests/data/content-coverage.test.ts` enforces teaching, practice, and quiz coverage for every official topic.
- Khan resources must use direct current `https://www.khanacademy.org/science/ap-college-physics-1/...` activity URLs. Avoid `highschool-physics`, old `/science/ap-physics-1/`, `en.khanacademy.org`, course roots, search pages, and archive/generic pages.
- If Khan's current course organization differs from the CED sequence, such as center of mass appearing under Khan's Linear Momentum unit while the CED topic is `2.1`, record the reviewed mapping in `KHAN_SKILL_TOPIC_CROSSWALK` instead of relying only on the Khan unit number.

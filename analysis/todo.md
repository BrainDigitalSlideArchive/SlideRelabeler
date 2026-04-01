# Instructions for agent

Blanket rules and background context:
1) Context: Refer to analysis/application-structure.md in order to understand the overall application structure and key components of the design. As we add new functionality, we should also plan to update application-structure.md to include the key aspects of the new features. This should be done once a feature is mature and tested so we don't pollute our ground truth reference with incomplete or buggy examples.
4) Rule: Do not make changes to the code that are not part of the plan you generate and which I have preapproved.
5) Rule: When you are making plans, explain each step in sufficient detail to guide me in making the proposed change myself if I want to.
6) Rule: Prioritize code conciseness and clarity. When working with lists and dicts in python, prioritize using comprehension expressions where possible instead of for loops, for readability and conciseness (and list/dict comprehension is often more performant)
7) Rule: Backwards compatibility is generally not needed at the current stage of development. Making code streamlined should be the priority. If you seen an opportunity where backwards compatibility might be desired, you can add this as an alternative plan that I can opt in to, but the default should be a clean implementation as if we were starting fresh.
8) Rule: Always try to identify areas of code that can be simplified. If convoluted logic is needed, the rationale for why the complexity is needed should be clearly documented in code comments.
9) Rule: Follow good practices like separation of concerns, don't repeat yourself, and maintaining consistency with existing patterns in the code base.
10) Rule: For python files, always check imports at the top of a file so that inline imports you add inline do not conflict.

Prompt: Please read analysis/todo.md, and create a detailed analysis including code snippets/locations in the existing code base, and make a plan for how to address the items in the TODO list. Ask any necessary clarifying questions rather than making assumptions about desired behavior unless otherwise specified. The items under the NOTES heading can be ignored for now.

# TODO list
1. We currently support the DSA as an upload endpoint. Now I want to add support for Globus too. It should be a configurable option to use globus and provide credentials, like we do already for DSA.

# NOTES [agent: do not make a plan to implement these things, these are my notes only]
- Features to add
-- Mac build process and documentation
-- integration with Globus, following the pattern of DSA integration
-- eSlideManager integration: configure with url and username/password, log in, and fetch slide info based on accession number, then filter by part/block/stain. This should be an optional feature which can be enabled by an env var or build flag; code should stay isolated from the rest of the codebase: we should think of it like a plugin

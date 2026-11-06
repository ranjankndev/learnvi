# Dependency Parsing: Who Did What to Whom: narration
<!-- Drafted by press draft (2026-11-06). Edit freely: it is yours now. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: dependency parsing.

[c02] Last time we drew sentences as trees of phrases. Today we draw them a different way: as links between words.

## idea
[c03] Here's the idea. In a dependency tree, every word hangs off exactly one other word, and the main verb usually sits at the very top.

## dep
[c04] A dependency is a link from a head word to a word that depends on it, with a label saying how they're related.

[c05] In "Priya ate pizza", the word "pizza" depends on "ate". It's the object: the thing that was eaten.

[c06] Think of a family tree. Every word has exactly one parent, except the root at the top, which has none.

## example
[c07] Let's parse "Priya ate cold pizza". The labels in brackets are the short names used by Universal Dependencies, a standard used for over a hundred languages.

[c08] Priya depends on ate. She's the subject: the one doing the eating.

[c09] Ate depends on nothing. It's the root of the whole sentence.

[c10] Cold depends on pizza, because it describes the pizza.

[c11] And pizza depends on ate: it's the object, the thing that was eaten.

## versus
[c12] How does this compare with last lesson's trees?

[c13] A constituency tree nests phrases inside phrases, with labels like noun phrase and verb phrase. It shows the grammatical structure.

[c14] A dependency tree links words directly, with labels like subject and object. It shows who did what to whom. They're two views of the same sentence.

## read
[c15] This makes dependency trees very handy for reading off meaning. Start at the top.

[c16] The root tells you what happened: ate.

[c17] The subject tells you who did it: Priya.

[c18] The object tells you what it was done to: pizza.

[c19] And modifiers add extra detail: the pizza was cold.

## projective
[c20] One more idea from your syllabus: projectivity. A dependency tree is projective if you can draw all its links as arcs above the sentence, without any of them crossing.

[c21] Most English sentences are projective. Some sentences, and languages with freer word order, like Czech or Dutch, have links that cross. Those are called non-projective, and some parsers can't build them.

[c22] Picture beads on a necklace, with strings tied between some of them. If none of the strings cross, the tree is projective.

## why
[c23] Dependency parsing has become the most widely used kind. Three reasons.

[c24] It works well across many languages, including ones with free word order.

[c25] It directly shows relations, which are easy to turn into facts: Priya, ate, pizza.

[c26] And fast parsers can build the tree step by step, one move at a time. That's next lesson.

## quiz
[c27] Quick quiz. In "Priya ate cold pizza", which word does "cold" depend on?

[c28 after=3] Pause the video and choose.

[c29] It's pizza. Cold describes the pizza, so pizza is its head.

## recap
[c30] Let's recap. In a dependency tree, every word hangs off one head word.

[c31] The main verb is usually the root at the top.

[c32] Each link has a label, like subject or object, saying how the words relate.

[c33] And a tree is projective if its links can be drawn without crossing.

[c34] Next lesson: {{next.short}}. {{next.question}}

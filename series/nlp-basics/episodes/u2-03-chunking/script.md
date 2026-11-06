# Chunking: Grouping Words into Phrases: narration
<!-- Drafted by press draft (2026-11-06). Edit freely: it is yours now. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: chunking.

[c02] Last time we tagged every word as a noun, a verb, and so on. Today we group those words into small phrases.

## idea
[c03] Here's the idea. Chunking groups words into small, useful phrases, without working out the full grammar of the sentence.

## chunk
[c04] A chunk is a short group of words that acts as one unit, such as a noun phrase. Chunks sit side by side and never overlap.

[c05] In "the big red bus stopped near my old school", the chunks are: the big red bus, stopped, near, and my old school.

[c06] Think of reading aloud. You naturally group words into bite-sized pieces, one breath at a time, without stopping to diagram the sentence.

## types
[c07] Each chunk gets a type. Let's label our sentence.

[c08] The big red bus is a noun phrase, NP for short: a noun with the words that describe it.

[c09] Stopped is a verb phrase, VP.

[c10] Near is a preposition, which links the bus to where it stopped.

[c11] And my old school is another noun phrase.

## bio
[c12] Here's a clever trick. We can turn chunking into a tagging job, just like part-of-speech tagging, using three letters.

[c13] B means this word begins a chunk.

[c14] I means this word is inside the chunk that's already started.

[c15] And O means the word is outside any chunk, like a full stop.

## tagged
[c16] Let's tag a short sentence: "The big bus stopped", with a full stop.

[c17] The begins a noun phrase, so it's B-NP.

[c18] Big is inside that noun phrase: I-NP.

[c19] Bus is still inside it: I-NP.

[c20] Stopped begins a verb phrase: B-VP.

[c21] And the full stop is outside every chunk, so it gets O.

## how
[c22] There are two ways to build a chunker.

[c23] A rule-based chunker uses patterns over part-of-speech tags. For example: a determiner, then any adjectives, then a noun, makes a noun phrase. It's easy to read, but real text often breaks the rules.

[c24] A learned chunker is a tagger that predicts B, I and O for each word, using many clues at once. It needs labelled examples to learn from, and today it's the usual choice.

## uses
[c25] So what are chunks good for?

[c26] They find the things a text talks about: people, places and products are usually noun phrases.

[c27] They help pull out simple facts. Apple, bought, a startup: who did what to what.

[c28] And they're a quick first step towards full parsing, which builds the complete structure of a sentence. That's coming up in unit three.

## quiz
[c29] Quick quiz. In BIO tagging, which tag does the word red get, in "the big red bus"?

[c30 after=3] Pause the video and choose.

[c31] It's I-NP. The word "the" begins the noun phrase, and big, red and bus are all inside it.

## recap
[c32] Let's recap. A chunk is a short group of words that acts as one unit.

[c33] The most common are noun phrases and verb phrases.

[c34] B, I and O tags turn chunking into a tagging job.

[c35] And chunks help find the things a text talks about, and simple facts about them.

[c36] Next lesson: {{next.short}}. {{next.question}}

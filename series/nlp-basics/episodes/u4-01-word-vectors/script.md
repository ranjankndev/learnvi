# Word Vectors: Giving Words a Place on a Map: narration
<!-- Drafted by press draft (2026-11-06). Edit freely: it is yours now. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: word vectors.

[c02] So far, a word has just been a token with an ID number. Today we give each word something richer: a place on a map of meaning.

## idea
[c03] This lesson rests on one old idea, from the linguist J. R. Firth in 1957. You shall know a word by the company it keeps.

## vector
[c04] A word vector is a list of numbers that places a word somewhere in a space of meaning. Words with similar meanings end up close together.

[c05] For example, the word rain might become a list of a few hundred numbers. On their own, the numbers mean little. What matters is where they put the word.

[c06] Think of a map. Two towns that are close together usually share a lot: weather, food, accent. Word vectors do the same for words.

## counts
[c07] The simplest way to build these vectors is to count. For each word, we count which other words appear near it in lots of text. Here's a tiny made-up example.

[c08] Rain often appears near wet and cloud, and never near bark.

[c09] Storm looks almost the same: wet, cloud, no bark. So the rows for rain and storm are similar, and that similarity is the meaning we're after.

[c10] Dog is different. It appears near bark, and hardly ever near cloud.

## build
[c11] Real tables are huge, with tens of thousands of columns. So we build vectors in three steps.

[c12] Count: go through millions of sentences, and count the neighbours of every word.

[c13] Compress: squeeze the giant table down to a few hundred numbers per word, keeping only the main patterns. A classic way to do this is called singular value decomposition, or SVD.

[c14] Compare: now, to see how similar two words are, we check how close their vectors are.

## similar
[c15] Here are some illustrative similarity scores, from zero for unrelated up to one for very similar.

[c16] Storm is very close to rain.

[c17] Umbrella is fairly close: it shows up in many of the same sentences.

[c18] And banana is far away. They simply don't keep the same company.

## maths
[c19] Something surprising happens in a good vector space: directions carry meaning, so you can do maths with words.

[c20] Start at king, take away man, add woman, and the nearest word is queen.

[c21] Start at Paris, take away France, add Italy, and you land near Rome. The direction from a country to its capital is roughly the same everywhere.

[c22] It even works for grammar: walked minus walk plus swim lands near swam.

## onehot
[c23] Why is this such a big deal? Compare it with what we had before.

[c24] With one ID per word, every word is equally far from every other. To the model, rain is as close to storm as it is to banana.

[c25] With word vectors, similar words sit close together, and the model can use that. Anything it learns about storm partly carries over to rain.

## quiz
[c26] Time for a quick quiz. Which word's vector is probably closest to the vector for rain: storm, banana, or Tuesday?

[c27 after=3] Pause the video and choose.

[c28] It's storm. Rain and storm appear near the same words, like wet, cloud and weather, so their vectors end up close together.

## recap
[c29] Let's recap. A word gets its meaning from the company it keeps.

[c30] A word vector is a list of numbers that places the word on a map of meaning.

[c31] Words with close vectors have similar meanings.

[c32] And directions in that map carry meaning, so king minus man plus woman lands near queen.

[c33] Next lesson: {{next.short}}. {{next.question}}

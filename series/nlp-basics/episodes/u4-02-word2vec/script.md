# Word2Vec: Learning Word Vectors from Context: narration
<!-- Drafted by press draft (2026-11-06). Edit freely: it is yours now. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: Word2Vec.

[c02] Last time we built word vectors by counting. Today we meet the famous method that learns them instead, just by reading.

## idea
[c03] Here's the idea. Learn word vectors by playing a simple guessing game, millions of times: predict which words appear near each other.

## w2v
[c04] Word2Vec is a method published in 2013. It learns word vectors by training a small network to predict which words appear near each other.

[c05] In "the cat sat", the word cat appears next to the and sat. The network learns from pairs like these.

[c06] Think of learning a language through millions of fill-in-the-blank exercises. You end up with a feel for which words belong together.

## window
[c07] Where do the training pairs come from? A sliding window. Here, the window covers two words on each side of a centre word.

[c08] With quick in the centre, the neighbours are the, brown and fox.

[c09] Slide along to brown, and its neighbours are the, quick, fox and jumps.

[c10] And for fox, they're quick, brown and jumps. Every one of these pairs becomes a small training example.

## two
[c11] Word2Vec comes in two versions.

[c12] Skip-gram looks at the centre word and tries to guess its neighbours. It tends to do better for rare words.

[c13] CBOW, short for continuous bag of words, does the opposite: it looks at the neighbours and guesses the centre word. It's faster to train. Either way, we don't really care about the guesses. The vectors learned along the way are the real prize.

## loop
[c14] Here's the training loop, repeated millions of times.

[c15] Pick: take a word and one of its real neighbours, like fox and brown.

[c16] Guess: the network scores how likely the two are to be neighbours, by comparing their vectors.

[c17] Nudge: since they really are neighbours, move their vectors a little closer together.

[c18] Push away: and pick a few random words that are not neighbours, and move them a little further apart.

## negative
[c19] That last step has a name: negative sampling. Instead of comparing against every word in the vocabulary, which would be painfully slow, the model compares against just a handful of random words that aren't neighbours.

[c20] So alongside the real pair, fox and brown, it sees a few fake pairs, like fox and carpet, or fox and Tuesday, and learns to tell them apart.

[c21] It's like learning what a cat is by also being shown a few things that aren't cats.

## results
[c22] So what does all this give us?

[c23] Word2Vec learns from huge amounts of text, quickly, without any labels. The text itself is the teacher.

[c24] Words with similar meanings end up close together, and you get the word maths from earlier, like king minus man plus woman.

[c25] But there's a catch. Each word gets exactly one vector, so "bank", the river kind and the money kind, has to share one. We'll fix that in unit five.

## quiz
[c26] Quick quiz. In skip-gram, what does the model try to predict?

[c27 after=3] Pause the video and choose.

[c28] It predicts the neighbours of a word. It takes the centre word, and guesses the words that appear around it.

## recap
[c29] Let's recap. Word2Vec learns word vectors by guessing which words are neighbours.

[c30] The training pairs come from a sliding window over the text.

[c31] Skip-gram guesses the neighbours from the centre word. CBOW guesses the centre word from its neighbours.

[c32] And negative sampling keeps training fast, by comparing with just a few random words.

[c33] Next lesson: {{next.short}}. {{next.question}}

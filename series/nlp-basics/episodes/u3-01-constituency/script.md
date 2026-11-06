# Constituency Parsing: Sentences as Trees: narration
<!-- Drafted by press draft (2026-11-06). Edit freely: it is yours now. -->

## intro
> Warm and welcoming.
[c01] Welcome to unit three of NLP, Simply Explained. This is lesson {{episode.lesson}}: constituency parsing.

[c02] In unit two we tagged words and grouped them into small chunks. Now we go all the way, and find the complete structure of a sentence.

## idea
[c03] Here's the idea. A sentence isn't a flat list of words. It's a tree: phrases nested inside bigger phrases.

## constituent
[c04] The building blocks are called constituents. A constituent is a group of words that works as one unit. A quick test: can you replace the group with a single word?

[c05] In "the old man slept", you can replace "the old man" with "he". So "the old man" is a constituent.

[c06] Think of nesting boxes. Small boxes are packed inside bigger boxes, and the biggest box holds the whole sentence.

## build
[c07] Let's build the tree for "the old man slept", from the bottom up.

[c08] Words: we start with the four words at the bottom of the tree.

[c09] Noun phrase: "the old man" joins into one noun phrase, NP.

[c10] Verb phrase: "slept" forms the verb phrase, VP.

[c11] Sentence: finally, the noun phrase and the verb phrase join into the whole sentence, S, at the top of the tree.

## grammar
[c12] A parser knows which joins are allowed from a set of rules, called a context-free grammar. Here's a tiny one.

[c13] S goes to NP VP: a sentence is a noun phrase followed by a verb phrase.

[c14] NP goes to determiner, adjective, noun: like "the old man".

[c15] VP goes to VERB NP: a verb followed by its object, like "saw a dog".

[c16] And VP can also be just a verb on its own, like "slept".

## telescope
[c17] Here's why parsing is hard. Take: "I saw the man with the telescope."

[c18] In one tree, "with the telescope" belongs to "the man". The man is the one holding the telescope.

[c19] In the other tree, it belongs to "saw". I used the telescope to see him. Same words, two different trees.

## pcfg
[c20] So how does a parser choose between trees? It gives each grammar rule a probability. That's a probabilistic context-free grammar, or PCFG. The probabilities are learned by counting rules in a treebank: a large set of sentences that people have parsed by hand.

[c21] Common rules, like a verb followed by its object, get high probabilities. Rare rules get low ones. The tree whose rules are most likely overall wins.

[c22] Think of a sat-nav. There are many possible routes, and it picks the one most likely to get you there.

## cky
[c23] A sentence can have thousands of possible trees, so the parser needs a smart search. A classic one is called CKY. Here's the idea.

[c24] First, find the best phrases for every pair of neighbouring words.

[c25] Then for every run of three words, then four, and so on.

[c26] Each bigger step reuses the small results already found, so nothing is worked out twice.

[c27] When it reaches the full sentence, the best tree over all the words wins.

## quiz
[c28] Quick quiz. Why does "I saw the man with the telescope" have two different trees?

[c29 after=3] Pause the video and choose.

[c30] Because "with the telescope" can attach to "saw", or to "the man". Each choice gives a different tree, and a different meaning.

## recap
[c31] Let's recap. A sentence is a tree of phrases inside phrases.

[c32] A context-free grammar lists which joins are allowed.

[c33] Many sentences can be parsed into more than one tree.

[c34] And a probabilistic grammar, a PCFG, picks the most likely tree.

[c35] Next lesson: {{next.short}}. {{next.question}}

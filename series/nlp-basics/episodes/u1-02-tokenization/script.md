# Tokenization: narration
<!-- One paragraph = one cue. Kit scenes reveal one item per paragraph unless an item has an "at" mark. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: tokenization.

[c02] Last time we climbed the staircase of NLP. Today we stand on the very first step, and look closely at how text gets cut into pieces.

## idea
[c03] Here is the idea to hold on to. A model never reads text the way you do. It reads tokens.

## token
[c04] So what is a token? A token is one unit of text that a model works with. It can be a whole word, a piece of a word, or a punctuation mark.

[c05] Take the sentence "I don't like rain!" A typical tokenizer cuts it into six tokens: I, do, [[n't|n apostrophe t]], like, rain, and the exclamation mark.

[c06] Think of it like chopping vegetables before you cook. You can't cook a whole pumpkin in one go, and the size you cut the pieces into changes everything.

## spaces
[c07] The obvious first idea is to split the text wherever there is a space. Let's see where that goes wrong.

[c08] "traffic" with an exclamation mark stays glued together, so the punctuation becomes part of the word.

[c09] "don't" stays as one piece, even though it really means two words: do and not.

[c10] In "Doctor Rao", the dot after "Dr" does not end a sentence, but a simple splitter can't tell.

[c11] And "New York" is one name, but splitting on spaces breaks it into two unrelated words.

## sizes
> Slow down for the verdict.
[c12] Fixing those cases with rules helps, but there is a bigger question: how big should a piece be? Let's cut the word "raindrops" three ways.

[c13] Option one: single characters. The vocabulary is tiny, and nothing is ever unknown. But every sentence turns into a very long sequence of letters.

[c14] Option two: whole words. Each piece has meaning, but there are millions of words, names and typos. Any word missing from the list becomes "unknown".

[c15] Option three: subwords. "raindrops" becomes "rain" plus "drops". Common words stay whole, and rare words are built from smaller pieces. {@verdict}That balance is why modern models use subwords.

## bpe
[c16] The most popular way to build a subword vocabulary is called Byte Pair Encoding, or BPE. It has just four steps.

[c17] Split: start by breaking every word into single characters.

[c18] Count: count how often each pair of neighbouring pieces appears.

[c19] Merge: glue the most common pair together into a new piece.

[c20] Repeat: count again and merge again, until the vocabulary is as big as you want.

## worked
[c21] Let's try it on a tiny example. Our text contains "rain" nine times, "rainy" four times, "raining" five times and "train" three times.

[c22] The most common pair is "i" followed by "n": twenty-six times, because "raining" contains it twice. So "i" and "n" merge into "in".

[c23] Next, "r" followed by "a" appears twenty-one times, so it becomes "ra".

[c24] Then "ra" and "in" merge into "rain". After just three merges, the whole word "rain" is a single token.

## count
[c25] Now compare how many pieces each approach needs for "raindrops".

[c26] As characters, it is nine tokens: long, and each letter means very little.

[c27] As subwords, it is just two: "rain" and "drops".

[c28] As a whole word, it is one, but only if "raindrops" happens to be in the vocabulary. Subwords give short sequences, with no unknown words.

## quiz
[c29] Time for a quick quiz. A subword tokenizer meets the word "unfriendliness" for the first time. What happens?

[c30 after=3] Pause the video and choose. Does it mark the word as unknown, split it into known pieces, or skip it?

[c31] It splits it into known pieces: un, friend, li, ness. Pieces it has seen many times before.

## recap
[c32] Let's recap. A token is one unit of text that a model reads.

[c33] Splitting on spaces alone is not enough: punctuation, contractions and names get in the way.

[c34] Subwords balance the two extremes: shorter than characters, and never unknown like whole words.

[c35] And BPE builds that vocabulary in four steps: split, count, merge, repeat.

[c36] Next lesson: {{next.short}}. {{next.question}}

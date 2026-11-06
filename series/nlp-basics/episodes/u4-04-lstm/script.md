# LSTMs: Remembering What Matters: narration
<!-- Drafted by press draft (2026-11-06). Edit freely: it is yours now. -->

## intro
> Warm and welcoming.
[c01] Welcome back to NLP, Simply Explained. This is unit {{episode.unit}}, lesson {{episode.lesson}}: LSTM networks.

[c02] Last time, plain RNNs forgot the start of long sentences. Today's network was designed to fix exactly that.

## idea
[c03] Here's the idea. An LSTM keeps a separate, protected memory, and uses little gates to decide what to keep, what to forget, and what to use.

## lstm
[c04] LSTM stands for long short-term memory. It's an RNN with a separate memory cell, and gates that control what gets written into it, kept in it, and read from it.

[c05] In "the keys that I left on the table are missing", it can hold on to "keys" until it reaches "are".

[c06] Think of a notebook with a careful editor. The editor crosses out old notes, adds new ones, and chooses what to read aloud right now.

## gates
[c07] There are three gates, each with one job.

[c08] The forget gate decides what to erase from memory, because it's no longer needed.

[c09] The input gate decides what new information from this word is worth writing down.

[c10] And the output gate decides which part of the memory to use right now.

## example
[c11] Here's a simplified picture of the gates at work on our sentence.

[c12] At "keys", the input gate writes a note: the subject is plural.

[c13] Through "that I left on the table", the forget gate leaves that note alone, so it survives the detour.

[c14] At "are", the output gate reads the note: plural subject, so the verb should be "are".

## vs
[c15] So what's really different?

[c16] A plain RNN has one memory that gets completely rewritten at every step, so long-range details fade away.

[c17] An LSTM changes its memory cell carefully, only where the gates allow. That protects important information, and it lets the learning signal travel much further back without vanishing.

## bi
[c18] One more trick: a bidirectional LSTM, or BiLSTM. It runs two LSTMs, one reading left to right, and one reading right to left. Together, every word gets to see what comes both before and after it.

[c19] To understand "bank" in "she sat on the bank of the river", the words after it, "of the river", matter a lot.

[c20] It's like reading a sentence twice: once forwards, and once backwards.

## uses
[c21] LSTMs had a big impact.

[c22] For several years they powered machine translation, speech recognition, and tagging.

[c23] A simpler cousin, the GRU, does a similar job with just two gates.

[c24] In most tasks, they were later replaced by Transformers, which you'll meet with BERT in unit five.

## quiz
[c25] Quick quiz. Which LSTM gate decides what to erase from memory?

[c26 after=3] Pause the video and choose.

[c27] It's the forget gate. It decides which parts of the memory are no longer needed.

## recap
[c28] Let's recap. An LSTM keeps a separate, protected memory cell.

[c29] Three gates, forget, input and output, control what goes in and out.

[c30] That keeps long-range information alive, so it remembers "keys" until "are".

[c31] And a BiLSTM reads in both directions, so every word sees its whole context.

[c32] Next lesson: {{next.short}}. {{next.question}}

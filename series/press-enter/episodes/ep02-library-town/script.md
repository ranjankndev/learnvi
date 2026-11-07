# Library Town: narration
<!-- One paragraph = one cue. {@name} marks a word an animation waits for. -->

## passport
> Upbeat, like a travel announcement.
[c01] Next stop: {{stop.name}}! Passport out. {@stamp}Stamped.

[c02] This is stop number {{episode.number}} of seven. Last time we followed our prompt all the way to an answer. Today we ask where the model came from.

## hook
> Slow down on "strange".
[c03] Before it could answer you, the model read a huge share of the public internet: books, articles, websites, code.

[c04] But here's the twist. All that reading only turned it into a strange autocomplete, not a helpful assistant. Let's see how it went to school.

## route
[c05] On the route map, we've left the Departure Gate, and we're {@here}here, in {{stop.name}}, where the model was trained.

## school
[c06] Think of the model's training as three stages of school.

[c07] Reading: first, it reads an enormous amount of text. This is called pre-training.

[c08] Practice: then it practises answering instructions, from worked examples. This is called instruction tuning.

[c09] Feedback: finally, it learns which of its answers people actually prefer.

## pretrain
[c10] Stage one, reading. Pre-training means reading a huge amount of text while playing just one game, over and over: predict the next word.

[c11] Shown "The capital of France is", it learns to predict "Paris". Repeat that across trillions of words, and it picks up grammar, facts, and styles of writing along the way.

[c12] Think of a student who reads every book in the library, cover to cover.

## stores
[c13] So what does the model keep from all that reading? Not what you might expect.

[c14] It doesn't keep a copy of the internet. There's no folder of saved web pages, and it can't look up a page it once read.

[c15] Instead, it keeps patterns, stored in billions of numbers called parameters, which were adjusted a tiny bit with every prediction. Patterns of grammar, facts, styles, and ways of reasoning. Patterns, not pages.

## base
[c16] Here's what that strange autocomplete looks like. A model straight out of pre-training is called a base model. Watch what happens when you ask it a question.

[c17] You type: "What is the capital of France?"

[c18] And it might reply: "What is the capital of Germany? What is the capital of Italy?" It isn't being rude. It's continuing the text, the way a list of quiz questions continues online.

## instruct
[c19] Stage two, practice. Instruction tuning means more training on many examples of instructions paired with good answers, so the model learns to respond like an assistant.

[c20] For example: "Summarise this article", followed by a clear, short summary. Thousands of examples like that teach it the shape of a helpful reply.

[c21] It's like practising past exam papers, with model answers to learn from.

## feedback
[c22] Stage three, feedback. Often called reinforcement learning from human feedback, or RLHF. It works like this.

[c23] Generate: the model writes two different answers to the same prompt.

[c24] Compare: people look at both, and pick the better one.

[c25] Learn: from many of those choices, a separate scoring model learns what people tend to prefer.

[c26] Improve: the main model is then tuned to write answers that score higher. That's where much of its politeness and helpfulness comes from.

## cutoff
[c27] There's one catch to all this schooling, and it explains a lot of confusing answers.

[c28] The model's reading stops at a certain date, called its knowledge cutoff.

[c29] Anything that happened after that was never in its library, so it simply doesn't know about it.

[c30] Unless the app around it adds a web search, and passes the results in with your question.

## tryIt
> Friendly, like a challenge.
[c31] Time for "Try it yourself". Grab your phone.

[c32] First, with web search turned off, ask a chatbot: "What happened in the news last week?"

[c33 after=10] Then turn search on, and ask again. Compare the two answers. Notice which one admits it doesn't know, and which one can actually tell you.

## myth
> Pause before "reality".
[c34] Myth versus reality.

[c35] The myth: the model learns from my chats in real time.

[c36] The {@reality}reality: its knowledge is fixed when training ends. Within a conversation it can use what you've said, like short-term memory, but that doesn't change the model itself. Whether conversations are used to train future versions depends on the app and your settings.

## useIt
[c37] And here's your "Use it tomorrow" tip: don't trust recent facts unless search is on.

[c38] If you're asking about anything recent, turn search on. Ask for sources and dates. And double-check anything that changes fast, like prices, laws, or the news.

## recap
[c39] Let's stamp the passport. The model went to school in three stages: reading, practice, and feedback.

[c40] It stores patterns, not pages, and its knowledge stops at a cutoff date.

[c41] Now let's go inside. {@question}Step one: how does the model even read your words? Next stop: {{next.stop}}.

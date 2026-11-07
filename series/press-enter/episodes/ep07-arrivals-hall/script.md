# Arrivals Hall: narration
<!-- One paragraph = one cue. {@name} marks a word an animation waits for. -->

## passport
> Upbeat, like a travel announcement. Final stop, a little celebratory.
[c01] Final stop: {{stop.name}}! Passport out, one last time. {@stamp}Stamped.

[c02] This is stop number {{episode.number}} of seven. At Prediction Station, we watched the model write its answer one token at a time. Today, we step out of the model, into the app around it.

## hook
> Slow down on "whole car".
[c03] Here's the last big idea of our trip. When you use ChatGPT, Claude, or Gemini, you're not talking to a bare model.

[c04] The model is the engine. The chat app is the whole car built around it: the steering, the mirrors, the seatbelts, and the satnav.

## route
[c05] On the route map, we've passed every stop, and we're {@here}here, at {{stop.name}}, where we finally see the whole journey.

## stack
[c06] Let's start with a surprise. When you type a message and press Enter, the app doesn't just send your message. It builds a whole package. Here's what the model actually sees.

[c07] First, a system prompt: hidden instructions from the app, like "you are a helpful assistant", and today's date.

[c08] Then, your own custom instructions, if you've set any. Like "I'm a student. Keep answers short."

[c09] Then, any documents the app found for you: passages from a file you uploaded, or results from a web search.

[c10] Then, the whole chat so far: every earlier message, from you and from the model.

[c11] And finally, at the very bottom, your actual message: "Write a short poem about the rain".

[c12] The app builds this whole package, every single turn. Your message is often the smallest part of it.

## system
[c13] Let's look closer at that first block: the system prompt. It's instructions the app adds before your message: who the assistant is, how it should behave, and useful facts like today's date.

[c14] It might say: "You are a helpful assistant. Answer clearly. Today is..." and often much more.

[c15] Think of the crew briefing before passengers board. You never see it, but it shapes the whole flight.

## memory
[c16] Now, here's a question. If the model doesn't change while you chat, how does it remember things?

[c17] Say you start with: "Hi! My name is Asha." It replies, {@greet}"Nice to meet you, Asha!"

[c18] Twenty messages later, you ask, "What's my name?" And it {@answer}says, "Your name is Asha."

[c19] It didn't memorise anything. Remember the package? The app simply sent the whole chat again, including that first message. The model read it fresh, like it was the first time.

[c20] That's why long chats get slower and costlier, as we saw at the Departure Gate. Some apps now also save short notes about you between chats, and quietly add them to the package too.

## tools
[c21] Next: tools. A model on its own can't browse the web or check today's weather. So the app lends it a hand.

[c22] First, the model asks for a tool. It writes a special request, like "search for rain today".

[c23] The app sees the request, and runs it: a web search, or a bit of code, or a calculator.

[c24] The results are fed back, added to the package.

[c25] And the model writes its answer, now using fresh facts it could never have learned in training.

## rag
[c26] A close cousin of tools is RAG, short for retrieval-augmented generation. When you chat with your own documents, the app finds the most relevant passages and adds them to the prompt before the model answers.

[c27] Your PDF goes in, the app picks the best few passages using meaning search, the same embeddings we met in Vector Valley, and the model answers, often with sources.

[c28] Think of an open-book exam. The model gets to look things up before it answers, which makes made-up answers much less likely.

## safety
[c29] And finally, safety. It isn't one switch. It's built in at several layers.

[c30] Training teaches the model to refuse clearly harmful requests.

[c31] Extra checks can screen what goes into the model, and what comes out.

[c32] And the rules differ between apps. So the same question can get a different answer in a different app.

## journey
[c33] Let's put the whole journey together. Here's everything that happens when you press Enter.

[c34] Training: long before you typed, the model learned from a vast library of text.

[c35] Tokens: your words are chopped into pieces, and turned into numbers.

[c36] Vectors: those numbers get meaning, a place on a map.

[c37] Attention: the words read each other, so bank finds river.

[c38] Prediction: the answer is written one token at a time.

[c39] And the app wraps it all: system prompts, memory, tools, and safety. That's the whole trip.

## tryIt
> Friendly, like a challenge.
[c40] Time for one last "Try it yourself". Let's see how much a few words of instruction can change.

[c41] Start a new chat, and say: "For this chat, you are a friendly pirate."

[c42 after=10] Now ask for our rain poem. Enjoy the pirate rain. Then ask it to stop being a pirate, and see how quickly its whole personality changes, just from a few words in the package.

## blooper
[c43] AI blooper time. One last one, and it's a good one.

[c44] In 2023, a car dealership in California put a chatbot on its website. A visitor told it to agree with everything the customer says, and to end every reply with a special phrase. Then he asked for a brand new SUV, with a budget of one dollar.

[c45] The chatbot replied: "That's a deal, and that's a legally binding offer: {@reply}no takesies backsies." No car was actually handed over. But it's a perfect reminder: a chatbot follows the instructions in its package, even the ones it shouldn't.

## myth
> Pause before "reality".
[c46] Myth versus reality.

[c47] The myth: the model learns from our chat while we talk.

[c48] The {@reality}reality: the model doesn't change while you chat. The app re-sends the conversation every turn, and may save a few notes. Any real learning happens much later, if ever, when a new version is trained.

## useIt
[c49] And here's your final "Use it tomorrow" tip: write your own custom instructions. Most chat apps have a settings page for this.

[c50] Tell it who you are, like "I'm a student in India". Tell it how to answer: "short, with examples". And what to avoid: "no jargon, please". It's added to your package every time, so you only have to say it once.

## recap
[c51] Let's stamp the passport, for the last time. The model is the engine. The app builds a package around your message: a system prompt, your instructions, documents, and the chat so far.

[c52] Tools fetch fresh facts, RAG lets it read your documents, and safety is built in at several layers. All seven stamps, collected.

[c53] From your keyboard to an answer, you've seen the whole journey. {@question}So now you know what really happens when you press Enter. Where will your next prompt take you? Thanks for travelling with us.

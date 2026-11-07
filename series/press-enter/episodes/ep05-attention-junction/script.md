# Attention Junction: narration
<!-- One paragraph = one cue. {@name} marks a word an animation waits for. -->

## passport
> Upbeat, like a travel announcement.
[c01] Next stop: {{stop.name}}! Passport out. {@stamp}Stamped.

[c02] This is stop number {{episode.number}} of seven. In Vector Valley, every word got its own place on a map of meaning. Today, the words start talking to each other.

## hook
> Slow down on "decide".
[c03] Here's a puzzle. The word bank can mean the side of a river, or a place that keeps your money.

[c04] On its own, the word can't tell you which. The words around it decide.

## route
[c05] On the route map, we've left Vector Valley, and we're {@here}here, at {{stop.name}}, where the model reads the whole sentence together.

## bank
[c06] At the end of our last stop, we asked: in "the bank of the river", how does the model know which bank you mean? Let's watch.

[c07] In "I sat on the bank of the river", the word bank looks around the sentence, and looks hardest at river. So this is the riverside.

[c08] Now: "I paid cash into the bank". This time, bank looks at cash and paid. So this is the money kind.

[c09] Same word, same starting vector, but a different meaning, because of what it paid attention to. The percentages on screen are just for illustration, but the idea is real.

## attention
[c10] This trick is called attention. Each word looks at every other word in the prompt, decides how much each one matters to it, and blends in a little of their meaning.

[c11] So bank, plus a lot of river, becomes riverbank.

[c12] Think of a busy railway junction. Announcements fill the air, but every traveller only listens for the ones that matter to their own train.

## prompt
[c13] Let's try it on our running prompt: "Write a short poem about the rain". What does the word poem pay attention to?

[c14] What kind of poem? A short one. About what? The rain. And write tells it this is a task, not a question.

[c15] After attention, poem is no longer just any poem. It now carries the idea of a short poem, about rain, that you want written.

## quiz
> Leave a real pause after the question.
[c16 after=5] Pause and predict. "The animal didn't cross the street because it was too tired." What does it refer to? The animal, the street, or the crossing?

[c17] The {@answer}answer is the animal. Streets don't get tired. Animals do.

## it
[c18] Watch the word it. With tired at the end, it looks mostly at animal.

[c19] Now change just one word: "because it was too wide". Suddenly, it looks at street instead. Animals aren't wide. Streets are.

[c20] One word at the end of the sentence changed how a word in the middle was understood. That's attention working across the whole sentence at once.

## how
[c21] So how does a word decide where to look? Here's the idea in four small steps, with no formulas.

[c22] First, ask. Every word makes a query: a little description of what it's looking for. The word it is looking for a thing that can be tired.

[c23] Second, match. Every word also has a key, like a label saying what it offers. The query is compared with every key.

[c24] Third, weigh. The match scores are turned into percentages that add up to one hundred.

[c25] Fourth, blend. Each word carries a value, its useful meaning, and the asking word mixes in those values using the percentages. Query, key, value: that's the heart of attention.

## heads
[c26] And the model doesn't do this just once. It has many attention heads, each looking at the same sentence in its own way.

[c27] One head may follow grammar: who did what to whom.

[c28] Another may link a word like it to the thing it refers to.

[c29] Another may simply watch the neighbouring words. Nobody assigns these jobs. They're learned during training, and many heads are hard to explain at all.

## transformer
[c30] Put all of this together and you get a transformer: the design inside almost every modern chatbot. It's a stack of layers, and each layer does two things.

[c31] The vectors come in, fresh from Vector Valley.

[c32] First, attention: the words look at each other and share meaning.

[c33] Then a feed-forward step, where each word thinks on its own for a moment, using what it just gathered.

[c34] And then it repeats, layer after layer, dozens of times. With every layer, the understanding of the sentence gets a little deeper.

## context
[c35] There is one limit. The model can only pay attention to what it can see. That's called the context window: the most tokens it can look at in one go, including your prompt, the chat so far, and its own answer.

[c36] Early chatbots could hold a few thousand tokens. Many today can hold hundreds of thousands.

[c37] Think of a desk. Only what fits on the desk can be read at once. Anything that falls off the edge is simply not there.

## middle
[c38] But even inside the window, attention isn't perfectly even. Researchers in 2023 hid a fact at different places in a long prompt, and asked models to find it.

[c39] Facts near the start, and near the end, were found most often. Facts in the middle were missed more.

[c40] They called it "lost in the middle". Newer models are much better at this, but the habit is worth knowing about.

## tryIt
> Friendly, like a challenge.
[c41] Time for "Try it yourself": a pause-and-guess quiz you can run on any chatbot.

[c42] First, ask it: "I saw her duck. What does that mean?" Before it answers, make your own guess. Is it a bird, or someone bending down?

[c43 after=10] Then add a little context: "I saw her duck behind the wall." Ask again, and watch how a few extra words change the meaning it picks.

## myth
> Pause before "reality".
[c44] Myth versus reality.

[c45] The myth: the model reads your prompt one word at a time, left to right, like we do.

[c46] The {@reality}reality: it reads the whole prompt at once, in parallel. Every word looks at every other word at the same time. Only the answer is written one token at a time, and that's our next stop.

## useIt
[c47] And here's your "Use it tomorrow" tip: put key instructions at the start or end of long prompts.

[c48] If you paste in a long document, put your main instruction first. For very long prompts, repeat it at the end. And keep the long reference text in the middle.

## recap
[c49] Let's stamp the passport. Attention lets every word look at every other word, and decide which ones matter.

[c50] That's how bank finds river, and how it finds the animal. Stack attention into dozens of layers and you get a transformer, reading everything inside its context window at once.

[c51] So now the model understands your prompt. {@question}But how does it pick each word of the answer, and why does it sometimes make things up? Next stop: {{next.stop}}.

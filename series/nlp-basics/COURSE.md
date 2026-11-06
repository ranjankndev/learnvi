# NLP, Simply Explained: course overview

19 lessons, 68 minutes of video in total. Generated from the series config, timelines and fact-check lists.

| # | Lesson | Length | Shorts |
| --- | --- | --- | --- |
| 1.1 | The Stages of NLP: From Letters to Meaning | 3:23 | The 5 stages every NLP system climbs, “I saw her duck”: why computers get confused, Quick quiz: which NLP stage is this? |
| 1.2 | Tokenization: How Text Becomes Pieces | 4:14 | How AI decides the size of a word piece, Quick quiz: what does AI do with a brand-new word? |
| 1.3 | Text Classification: Teaching Computers to Sort Text | 4:09 | Precision vs recall, explained with your spam folder, Quick quiz: your boss's email went to spam. What failed? |
| 1.4 | Language Models: Guessing the Next Word | 3:50 | How your phone guesses the next word, Quick quiz: can you beat a language model? |
| 2.1 | Morphology: The Building Blocks Inside Words | 3:45 | Stemming vs lemmatization in 40 seconds, Quick quiz: how many pieces in “unbreakable”? |
| 2.2 | Part-of-Speech Tagging: Is It a Noun or a Verb? | 3:44 | Why “book” confuses computers, Quick quiz: “Time flies like an arrow” |
| 2.3 | Chunking: Grouping Words into Phrases | 3:17 | BIO tags: how AI finds phrases, Quick quiz: B, I or O? |
| 2.4 | Generative vs Discriminative Models | 3:20 | Generative vs discriminative, explained with cats and dogs, Quick quiz: artist or judge? |
| 2.5 | Hidden Markov Models, Intuitively | 3:40 | How AI tags “the dog barks”, Quick quiz: what's hidden in a Hidden Markov Model? |
| 2.6 | Conditional Random Fields, Intuitively | 3:34 | How AI spots names, places and dates, Quick quiz: HMM or CRF? |
| 3.1 | Constituency Parsing: Sentences as Trees | 3:38 | One sentence, two meanings: the telescope problem, Quick quiz: why two trees? |
| 3.2 | Dependency Parsing: Who Did What to Whom | 3:23 | How AI finds who did what to whom, Quick quiz: what does “cold” hang on? |
| 3.3 | Transition-Based Parsing: Building Trees Step by Step | 3:24 | How a parser builds a sentence tree in 4 moves, Quick quiz: name that parser move |
| 4.1 | Word Vectors: Giving Words a Place on a Map | 3:42 | Word maths: king − man + woman = ?, Quick quiz: which word is closest to “rain”? |
| 4.2 | Word2Vec: Learning Word Vectors from Context | 3:38 | How Word2Vec learns from a sliding window, Quick quiz: what does skip-gram guess? |
| 4.3 | Recurrent Neural Networks: Reading with Memory | 3:20 | Why early AI forgot the start of sentences, Quick quiz: what does an RNN remember? |
| 4.4 | LSTMs: Remembering What Matters | 3:19 | The 3 gates that gave AI a memory, Quick quiz: which gate forgets? |
| 5.1 | Contextual Embeddings and ELMo | 3:13 | Why “bank” needs three different meanings in AI, Quick quiz: Word2Vec or ELMo? |
| 5.2 | BERT: Reading in Both Directions | 3:36 | How BERT learned by filling in blanks, Quick quiz: how did BERT learn? |

## Check before publishing

**1.1 Stages of NLP**
- [ ] “The dogs were barking loudly” stage-by-stage table is a teaching simplification

**1.2 Tokenization**
- [ ] “I don't like rain!” → 6 tokens follows the classic rule-based split; modern subword tokenizers differ
- [ ] “unfriendliness” → un · friend · li · ness is illustrative
- [ ] BPE counts (26, 21, 21) computed from the toy corpus

**1.3 Text Classification**
- [ ] Word counts and the 100-email test (18/20, 18/24) are a made-up example
- [ ] Naive Bayes described as clues voting (simplification)

**1.4 Language Models**
- [ ] Counts after 'a cup of' are illustrative
- [ ] Perplexity as an average branching factor is an intuition, not the exact definition
- [ ] 'Peanut butter and jelly' is US English; consider 'jam' for UK/Indian audiences

**2.1 Morphology**
- [ ] Stemming column uses classic Porter stemmer outputs (studies→studi, was→wa)

**2.2 POS Tagging**
- [ ] Accuracy ≈92% (most-common-tag baseline) and ≈97% (modern taggers) on English news text

**2.3 Chunking**
- [ ] Chunk labels: the example treats 'near' as its own preposition chunk (PP), as in CoNLL-2000 style
- [ ] BIO tag names follow the common B-NP / I-NP / O convention

**2.4 Generative vs Discriminative**
- [ ] 'Generative learns faster from little data; discriminative more accurate with lots' follows Ng & Jordan (2002); it's a tendency, not a rule

**2.5 Hidden Markov Models**
- [ ] 'More combinations than people on Earth': 12^10 ≈ 62 billion vs ~8 billion people
- [ ] Umbrella/weather analogy is a standard teaching example

**2.6 CRFs**
- [ ] Tag names are simplified (PERSON, PLACE, DATE); real datasets use names like PER, LOC, DATE
- [ ] 'CRF layer on top of neural networks' refers to BiLSTM-CRF style models

**3.1 Constituency Parsing**
- [ ] Grammar rules are simplified for teaching
- [ ] 'Thousands of possible trees' is a loose figure; it grows very fast with sentence length

**3.2 Dependency Parsing**
- [ ] UD relation names: nsubj, root, amod, obj
- [ ] Universal Dependencies covers 100+ languages (check the current count)
- [ ] Czech and Dutch as examples of more non-projective languages

**3.3 Transition Parsing**
- [ ] Move definitions follow Nivre's arc-eager system with ROOT starting on the stack
- [ ] 'About two moves per word' (each word is shifted once and reduced/popped once)

**4.1 Word Vectors**
- [ ] Firth quote and year (1957)
- [ ] Analogy examples are the well-known word2vec results; they hold approximately
- [ ] Counts table and similarity scores are illustrative

**4.2 Word2Vec**
- [ ] Word2Vec published 2013 (Mikolov et al.)
- [ ] Skip-gram better for rare words, CBOW faster: as reported by the Word2Vec authors

**4.3 RNNs**
- [ ] 'Before today's models arrived, RNNs powered much of NLP' (roughly 2014–2018)
- [ ] Translation with two RNNs = encoder-decoder (seq2seq)

**4.4 LSTMs**
- [ ] The gate-by-gate example is a simplified illustration, not what a trained LSTM literally stores
- [ ] GRU has two gates (update and reset)

**5.1 Contextual Embeddings**
- [ ] ELMo: Peters et al., 2018
- [ ] Lower layers = more syntax, higher = more semantics, as reported in the ELMo paper

**5.2 BERT**
- [ ] BERT: Devlin et al., 2018; pretrained on BooksCorpus and English Wikipedia
- [ ] 15% masking and next-sentence prediction are from the original BERT
- [ ] Google announced BERT in Search in October 2019
- [ ] Masked-word guesses are illustrative

---
title: "Local AI Shenanigans "
date: 2026-01-06T09:21:00+01:00
author: Rob
categories:
    - AI
tags:
    - Local AI
toc: true
draft: false
cover: cover.png
images:
  - cover.png
math: true
---

## My little adventure in Local AI (STT + Local LLMs)

In this post I’ll show you how I navigated the Local AI world.

Local AI = the world where your AI runs **on your own machine** (or a private server), so you can avoid those pesky money-grabbing companies.  
*(Just kidding. I’m not against you guys hiring me.)*
<!--more-->
To be fair, I already touched this subject back when I worked in an insurance company, so I didn’t fall into it totally by accident — but there **was** some relearning required.

If any of the words below look like Chinese to you (it probably will), don’t worry — I’ll explain everything in greater depth later 😄  
For now: just follow the vibe.

## Step 1: Local STT… and the classic dependency pain

The first thing I wanted was a simple **local STT** (Speech-to-Text).

I’m not completely agnostic to Anaconda lol, but I figured a simple `pip install` would be enough.

While digging, I found out the best current STT model you can run locally is **Whisper** (OpenAI). Then I learned there’s a faster version called **faster-whisper**, which can use an Nvidia GPU to speed up transcription.

So naturally I thought:

```bash
pip install faster-whisper
```

Naturally it wasn’t that simple.

### The dependency parade

I had to install a bunch of packages that weren’t really marked as essential, but in practice were needed to make the pip installation behave (classic).
Things like:

* `ffmpeg`
* `setuptools`
* `huggingface_hub`
* `tqdm`
* `tokenizers`

I already knew most of them, but I hadn’t touched Hugging Face in a long time. And for some reason, if I didn’t install these *before* `faster-whisper` (even with its own dependencies), the install would fail.

Then came the GPU side of the fun:

* I needed **cuDNN**
* and of course the **CUDA drivers** (thankfully already on my machine)

So I updated my CUDA drivers.

But I shouldn’t have.

Because then **ctranslate2** (a dependency of `faster-whisper`) started failing since it wanted **CUDA 12.x**, not **CUDA 13** :DDD

Fair to say it took me a bit of time… but I finally got it working.

### Results: genuinely mind-blowing

I was *very* pleasantly surprised. I’d been a bit away from local AI recently (or AI in general), so I didn’t expect `faster-whisper` to be this efficient.

It’s mind-blowingly good: **fast as hell**, accurate, and easy to use. Childish even.
Even the **small** model gives fantastic results.

Here’s a tiny snippet to give an example:

```python
from faster_whisper import WhisperModel

model_size = "small"
# Run on GPU with FP16
model = WhisperModel(model_size)

segments, info = model.transcribe(r"audio_samples/Therapie.mp3", beam_size=2)
```

---

### Step 2: Turning on the real beast — Local LLMs

Then I turned on the real beast: **local LLMs**.

From my past internship experience, I remembered the ecosystem could be… kind of a mess.

At first I tried the old way:

* `llama.cpp` (easy enough, I had already done it before)
* and then I installed **Ollama**, which for some godforsaken reason refused to recognize that I had a GPU.

{{< figure src="img/SadOllama.png" caption="Ollama made me sad." >}}

So I tried running models directly from the Hugging Face Python SDK. I downloaded **Gemma 12B**, but I got dissatisfied because I couldn’t use a **GGUF** model easily, so I kinda threw that approach away.

That said: I’m still very impressed by even the smallest local LLMs now.
Even **Gemma 1B** manages to create coherent JSONs.

That might sound obvious to you, but it wasn’t the case with Mistral a year and a half ago 😅

{{< figure src="img/gemmaSetup.png" caption="Setting up Gemma directly from the HF SDK." >}}
{{< figure src="img/gemma1B.png" caption="Gemma 1B behaving surprisingly well." >}}

---

### LM Studio 

Then I discovered an incredible alternative: **LM Studio**.

That little baby didn’t exist back in my days, but honestly: it’s fantastic.

It’s visually clean, easy to use, and the SDK isn’t full of boilerplate or weird fragmentation — just the good stuff.

{{< figure src="img/LMStudio.png" caption="LM Studio instantly became my favorite." >}}

Using LM Studio and its SDK, I quickly grabbed a quantized **Gemma 12B** and used it to summarize the audio file I had just transcribed.

And I was genuinely shocked by the speed and accuracy.

**12B parameters only**, and the results are good. Truly amazing.

I might be late to the hype train, but when you get a solid result in **~17 seconds for a 45 minutes monologue**, the idea of building a real local application suddenly becomes completely realistic.

And that’s the main goal here
For now, you can check my very tiny example on GitHub (much more to come soon ! ):

[https://github.com/RPGSynth/STT_App](https://github.com/RPGSynth/STT_App)
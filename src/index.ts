import "./index.scss";
import OpenAI from "openai";

document
  .getElementById("apiForm")
  .addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();

    const key = ((event.target as HTMLFormElement)[0] as HTMLInputElement)
      .value;
    const prompt = ((event.target as HTMLFormElement)[1] as HTMLTextAreaElement)
      .value;

    document.getElementById("response").innerText = "Fetching Response ...";
    startCompletions(key, prompt);
  });

async function startCompletions(key: string, prompt: string) {
  const openai = new OpenAI({
    apiKey: key,
    dangerouslyAllowBrowser: true,
  });
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0,
    max_tokens: 1024,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  console.log(response);

  document.getElementById("response").innerText =
    response.choices[0].message.content;
}

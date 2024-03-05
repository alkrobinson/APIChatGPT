import "./index.scss";
import OpenAI from "openai";

let openai = new OpenAI({
  apiKey: "",
  dangerouslyAllowBrowser: true,
});

(document.getElementById("apiKey") as HTMLInputElement).addEventListener(
  "input",
  async (event: InputEvent) => {
    openai.apiKey = (event.target as HTMLInputElement).value;
    try {
      const models = await openai.models.list();
      console.log("API Key is valid", models.data);
      
    } catch (error) {
      console.error("API Key is invalid", error);
      
    }
  }
);

document
  .getElementById("apiForm")
  .addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();
    const prompt = (document.getElementById("prompt") as HTMLTextAreaElement)
      .value;

    document.getElementById("response").innerText = "Fetching Response ...";
    startCompletions(prompt);
  });

async function startCompletions(prompt: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
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

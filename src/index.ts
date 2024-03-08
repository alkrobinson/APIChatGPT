import { MessageContentText } from "openai/resources/beta/threads/messages/messages";
import "./index.scss";
import OpenAI from "openai";
import { Marked } from "marked";
/**
 * Global variables so  that multiple functions can access them.
 */
let assistantChosen = "";
let openai = new OpenAI({
  apiKey: "",
  dangerouslyAllowBrowser: true,
});
let thread: OpenAI.Beta.Threads.Thread = null;
/**
 * This function is called when the user choses an assistant.
 * It will send the prompt to the assistant and display the response when ready.
 */
async function useAssistant(prompt: string) {
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: prompt,
  });
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistantChosen,
  });

  let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  let i = 0;
  let startTime = new Date();
  function myLoop() {
    i++;
    setTimeout(async () => {
      if (runStatus.status === "in_progress" && i < 15) {
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        myLoop();
        const checkTime = new Date();
        document.getElementById("response2").innerText =
          "Fetching Response ... " +
          "Time Elapsed: " +
          Math.round((checkTime.getTime() - startTime.getTime()) / 1000) +
          "s";
      } else {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const converter = new Marked();
        const markdownToHtml = await converter.parse(
          (messages.data[0].content[0] as MessageContentText).text.value
        );
        (document.getElementById("response") as HTMLTextAreaElement).value = markdownToHtml;
        (document.getElementById("response2") as HTMLDivElement).innerHTML = (document.getElementById("response") as HTMLTextAreaElement).value;
        let endTime = new Date();
        document.getElementById("response2").innerHTML +=
          "<br> Time Elapsed: " +
          Math.round((endTime.getTime() - startTime.getTime()) / 1000) +
          "s";
        console.log(messages.data);
      }
    }, 4000);
  }
  myLoop();
}
/**
 * This function is called when there is a valid api key.
 * It will get all available assistants and list them in the sidebar.
 */
async function listAssistants() {
  const myAssistants = await openai.beta.assistants.list({
    order: "desc",
    limit: 10,
  });

  myAssistants.data.forEach((assistant) => {
    const assistantButton = document.createElement("button");
    assistantButton.id = assistant.id;
    assistantButton.classList.add("assistant-button");
    assistantButton.innerText = assistant.name;
    document.getElementById("sidebar").appendChild(assistantButton);
    assistantButton.addEventListener("click", async (event: Event) => {
      if (assistantChosen === assistant.id) {
        assistantChosen = "";
        document.getElementById("assistantName").innerText = "None";
        document.getElementById("models").hidden = false;
        document.getElementById("modelLabel").hidden = false;
        assistantButton.classList.remove("chosen");
        thread = null;
        return;
      }
      document.getElementById("models").hidden = true;
      document.getElementById("modelLabel").hidden = true;
      assistantChosen = assistant.id;
      thread = await openai.beta.threads.create();

      document
        .querySelectorAll(".assistant-button")
        .forEach((button) => button.classList.remove("chosen"));
      assistantButton.classList.add("chosen");
      document.getElementById("assistantName").innerText = assistant.name;
    });
  });
}
/**
 * This function is called when the user begins to type in their api key.
 * It will check if the api key is valid and if it is, it will populate the models dropdown.
 * It will also get a list of assistants if the api key is valid.
 */
(document.getElementById("apiKey") as HTMLInputElement).addEventListener(
  "input",
  async (event: InputEvent) => {
    openai.apiKey = (event.target as HTMLInputElement).value;

    try {
      const models = await openai.models.list();
      models.data.forEach((model) => {
        const option = document.createElement("option");
        if (model.id.includes("gpt")) {
          option.value = model.id;
          option.innerText = model.id;
          document.getElementById("models").appendChild(option);
        }
      });
      await listAssistants();
      document.getElementById("models").hidden = false;
      document.getElementById("modelLabel").hidden = false;
    } catch (error) {
      console.error("API Key is invalid", error);
    }
  }
);
/**
 * This function is called when the user submits their prompt.
 * It will get the prompt value and pass it to a function to fetch the response.
 */
document
  .getElementById("apiForm")
  .addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();
    const prompt = (document.getElementById("prompt") as HTMLTextAreaElement)
      .value;
    document.getElementById("response2").innerText = "Fetching Response ...";
    if (assistantChosen !== "") {
      useAssistant(prompt);
    } else {
      startCompletions(prompt);
    }
  });
/**
 * This function is called when the user submits their prompt.
 * It will fetch the response from the OpenAI API and display it on the page.
 */
async function startCompletions(prompt: string) {
  const response = await openai.chat.completions.create({
    model: (document.getElementById("models") as HTMLSelectElement).value,
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
  const converter = new Marked();
  const markdownToHtml = await converter.parse(
    response.choices[0].message.content
  );
  document.getElementById("response2").innerHTML = markdownToHtml;
}
const form = document.getElementById("form");
const apiKeyInput = document.getElementById("apiKey");
const gameSelected = document.getElementById("gameSelected");
const questionInput = document.getElementById("question");
const aiResponse = document.getElementById("aiResponse");
const btnAsk = document.getElementById("btnAsk");

const markdownToHTML = (markdown) => {
    const converter = new showdown.Converter();
    return converter.makeHtml(markdown);
}

// Função para perguntar à IA usando a API Gemini
const perguntarIA = async (apiKey, game, question) => {
    const model = "gemini-2.5-flash";
    const geminiURL =  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    /* Engenharia de Prompt aplicada para receber uma resposta mais assertiva: */
    const pergunta = `
    ## Especialidade
    - Você é um assistente especialista em videogames e no jogo ${game}.

    ## SUA TAREFA
    - Você deve responder a pergunta do usuário com base em pesquisas e em seu conhecimento sobre o jogo mencionado.

    ## Regras Críticas
    1.  **Não invente informações.** Sua resposta deve ser baseada em fatos conhecidos, precisos e verificáveis sobre o jogo.
    2.  **Se você não souber a resposta ou não tiver informações suficientes, responda com a seguinte frase:** "Não foi possível encontrar uma resposta para essa pergunta."
    3.  **Se a pergunta não estiver relacionada ao jogo, responda com a seguinte frase:** "Essa pergunta não está relacionada ao jogo ${game}."
    4.  **Use ferramentas de pesquisa.** Utilize a ferramenta de pesquisa do Google para encontrar informações relevantes, se necessário.
    5.  **Considere a data atual ${new Date().toLocaleDateString()}.** Faça pesquisas atuais e atualizadas.
    6.  **Leve em consideração o patch atual do jogo.** Faça pesquisas atualizadas sobre o patch atual do jogo e nunca responda itens dos quais você não tenha certeza de que exista no patch atual.

    ## Resposta
    1.  **Seja breve.** Evite saudações, introduções ou qualquer texto que não seja a resposta direta.
    2.  **Resuma a resposta.** Responda à pergunta do usuário de forma extremamente concisa e resumida.
    3.  **Use Markdown.** Formate sua resposta usando Markdown para facilitar a leitura, incluindo títulos, listas e negrito quando necessário.

    ## Exemplo de resposta
    - **Pergunta:** Qual é a build mais atual para o personagem X?
    - **Resposta:** A build mais atual é: [especifique a build aqui]. \n\n **Itens:** coloque os itens aqui. \n\n **Runas:** liste as runas aqui.

    ## Pergunta do usuário
    - ${question}`

    const contents = [{
        role: "user",
        parts: [{
            text: pergunta
        }]
    }];

    const tools = [{
        google_search: {}
    }];

    // chamada da API Gemini
    const response = await fetch(geminiURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents,
            tools
        })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

const enviarFormulario = async (event) => {
    event.preventDefault(); /* Impede o envio padrão do formulário, impedindo o recarregamento da página e dos valores informados */

    const apiKey = apiKeyInput.value;
    const game = gameSelected.options[gameSelected.selectedIndex].text;
    const question = questionInput.value;

    if(!apiKey || !game || !question) {
        alert("Por favor, preencha todos os campos do formulário.");
        return;
    }

    btnAsk.disabled = true; /* Desabilita o botão para evitar múltiplos envios */
    btnAsk.textContent = "Perguntando...";
    btnAsk.classList.add("loading");
    aiResponse.classList.add("hidden"); /* Esconde a resposta da IA antes de enviar a pergunta */

    try {
        const text = await perguntarIA(apiKey, game, question);
        aiResponse.querySelector(".response-content").innerHTML = markdownToHTML(text);
        aiResponse.classList.remove("hidden"); /* Exibe a resposta da IA */
    } catch (error) {
        console.error("Erro ao enviar pergunta:", error);
        alert("Ocorreu um erro ao enviar a pergunta. Por favor, tente novamente mais tarde.");
    } finally {
        btnAsk.disabled = false; /* Reabilita o botão após a tentativa de envio */
        btnAsk.textContent = "Perguntar";
        btnAsk.classList.remove("loading");
    }
};

form.addEventListener("submit", enviarFormulario);
const form = document.getElementById("form");
const apiKeyInput = document.getElementById("apiKey");
const gameSelected = document.getElementById("gameSelected");
const questionInput = document.getElementById("question");
const aiResponse = document.getElementById("aiResponse");
const btnAsk = document.getElementById("btnAsk");

const toggleBtnAsk = (estate) => {
    btnAsk.disabled = estate; /* Desabilita o botão para evitar múltiplos envios */
    btnAsk.textContent = estate ? "Perguntando..." : "Perguntar";
    btnAsk.classList.toggle("loading", estate); /* Adiciona ou remove a classe de loading */
    if (estate) {
        aiResponse.classList.add("hidden"); /* Esconde a resposta da IA enquanto pergunta está sendo enviada */
    }
}

const markdownToHTML = (markdown) => {
    const converter = new showdown.Converter(); // Inicializa o conversor Markdown para HTML
    return converter.makeHtml(markdown);
}

const buildPrompt = (game, question) => {
    
    /* Engenharia de Prompt aplicada para receber uma resposta mais assertiva: */
    return `
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
        - ${question}`;
}

// Função para perguntar à IA usando a API Gemini
const perguntarIA = async (apiKey, prompt) => {
    // configurações da API Gemini
    const model = "gemini-2.5-flash";
    const geminiURL =  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // conteúdo do body da requisição
    const contents = [{
        role: "user",
        parts: [{
            text: prompt
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

    // resposta obtida da API
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// Função chamada quando o formulário é submetido em tela
const enviarFormulario = async (event) => {
    event.preventDefault(); /* Impede o envio padrão do formulário, ou seja, o recarregamento da página e dos valores informados */

    // Obtém os valores dos campos do formulário
    const apiKey = apiKeyInput.value;
    const game = gameSelected.options[gameSelected.selectedIndex].text;
    const question = questionInput.value;

    // Verifica se todos os campos estão preenchidos
    if(!apiKey || !game || !question) {
        alert("Por favor, preencha todos os campos do formulário.");
        return;
    }

    toggleBtnAsk(true); /* Desabilita o botão enquanto a pergunta está sendo enviada */
    try {
        const text = await perguntarIA(apiKey, buildPrompt(game, question));
        aiResponse.querySelector(".response-content").innerHTML = markdownToHTML(text);
        aiResponse.classList.remove("hidden"); /* Exibe a resposta da IA */
    } catch (error) {
        console.error("Descrição do erro ao enviar a pergunta:", error);
        alert("Ocorreu um erro ao enviar a sua pergunta. Por favor, tente novamente mais tarde.");
    } finally {
        toggleBtnAsk(false); /* Reabilita o botão após a tentativa de envio */
    }
};

// Adiciona o evento de submit ao formulário
form.addEventListener("submit", enviarFormulario);
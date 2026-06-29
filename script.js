// ==========================================
// 1. CONFIGURAÇÕES E CHAVES DE ACESSO (APIs)
// ==========================================
const APIKEY_OMDB = window._env_ ?.APIKEY_OMDB || "54aa102a"; 
const URL_OMDB = `https://omdbapi.com/?apikey=${APIKEY_OMDB}`;

const APIKEY_TMDB = window._env_?.APIKEY_TMDB || "45832b7c73620abf30f04853dc67f318"; 
const URL_TMDB = "https://api.themoviedb.org/3/";
const URL_IMAGEM_TMDB = "https://image.tmdb.org/t/p/w500"; 

const posterPadrao = "data:image/svg+xml;utf8,<svg xmlns='http://w3.org' width='500' height='750' viewBox='0 0 500 750'><rect width='500' height='750' fill='%23cccccc'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='30' fill='%23666666'>Sem Imagem</text></svg>";

// ==========================================
// 2. FUNÇÕES DE BUSCA NA INTERNET (FETCH)
// ==========================================

const buscaOMDB = async (titulo) => {
    try {
        const response = await fetch(URL_OMDB + "&s=" + titulo + "&type=movie");
        if (!response.ok) throw new Error();
        const data = await response.json();
        
        const listaPadronizada = [];
        if (data.Search) {
            for (const filme of data.Search) {
                listaPadronizada.push({
                    id: filme.imdbID,
                    titulo: filme.Title,
                    ano: filme.Year,
                    poster: filme.Poster !== "N/A" ? filme.Poster : posterPadrao,
                    apiOrigem: "omdb"
                });
            }
        }
        return listaPadronizada;
    } catch (error) {
        return [];
    }
};

// VARIÁVEL GLOBAL (Coloque logo acima da função buscaTMDBOrdenado para guardar os filmes na memória)
let bibliotecaFilmesCacheada = [];

// SUBSTITUA APENAS ESTA FUNÇÃO NA SUA SEÇÃO 2:
const buscaTMDBOrdenado = async (titulo, pagina = 1) => {
    try {
        const termoMin = titulo.toLowerCase().trim();
        const itensPorPagina = 20;

        if (pagina === 1) {
            const paginasLote = ["1", "2", "3", "4", "5", "6", "7", "8"];
            let resultadosBrutos = [];
            
            // ALTERAÇÃO AQUI: Mudamos de search/movie para search/multi para pescar filmes e séries juntos!
            const promessas = paginasLote.map(num => 
                fetch(`${URL_TMDB}search/multi?api_key=${APIKEY_TMDB}&query=${encodeURIComponent(titulo)}&language=pt-BR&page=${num}`).then(res => res.json())
            );
            
            const respostas = await Promise.all(promessas);
            respostas.forEach(data => {
                if (data.results) resultadosBrutos = resultadosBrutos.concat(data.results);
            });

            let listaPadronizada = [];
            for (const filme of resultadosBrutos) {
                // Filtra para ignorar perfis de atores/diretores que a rota multi às vezes traz
                if (filme.media_type === "person") continue;

                let anoExibicao = "N/A";
                let anoOrdenacao = 9999; 

                // Captura a data correta seja de Filme (release_date) ou Série/Anime (first_air_date)
                const dataCrua = filme.release_date || filme.first_air_date || "";

                if (dataCrua && typeof dataCrua === "string" && dataCrua.length >= 4) {
                    const anoPuro = dataCrua.substring(0, 4);
                    anoExibicao = anoPuro;
                    anoOrdenacao = parseInt(anoPuro, 10);
                }
                
                const urlPoster = (filme.poster_path && filme.poster_path !== "null") 
                    ? (URL_IMAGEM_TMDB + filme.poster_path) 
                    : posterPadrao;
                
                listaPadronizada.push({
                    id: filme.id,
                    titulo: filme.title || filme.name || "Sem título",
                    ano: anoExibicao,
                    anoNumero: anoOrdenacao,
                    poster: urlPoster,
                    // Guarda se é 'movie' ou 'tv' para a etiqueta saber diferenciar
                    apiOrigem: filme.media_type || (filme.first_air_date ? "tv" : "tmdb"),
                    diretor: "Não informado",
                    
                    // Guarda as tags necessárias para a etiqueta de Anime funcionar
                    generos: filme.genre_ids || [],
                    paisOrigem: filme.origin_country || []
                });
            }

            // Remove duplicados e filtra por termo
            const idsVistos = new Set();
            bibliotecaFilmesCacheada = listaPadronizada.filter(filme => {
                const t = filme.titulo.toLowerCase();
                const jahExiste = idsVistos.has(filme.id);
                idsVistos.add(filme.id);
                return !jahExiste && filme.ano !== "N/A" && t.includes(termoMin);
            });

            // Mantém os seus modos de ordenação intactos
            const selectElement = document.getElementById("select-ordenacao");
            const modoOrdenacao = selectElement ? selectElement.value : "cronologica";
            const inputVazio = document.getElementById("input-busca")?.value.trim() === "";

            if (inputVazio) {
                // Home mantém a popularidade
            } else if (modoOrdenacao === "cronologica") {
                bibliotecaFilmesCacheada.sort((a, b) => {
                    if (a.apiOrigem === "tv" && b.apiOrigem !== "tv") return -1;
                    if (b.apiOrigem === "tv" && a.apiOrigem !== "tv") return 1;
                    
                    return a.anoNumero - b.anoNumero;
                });
            } else if (modoOrdenacao === "diretor") {
                bibliotecaFilmesCacheada = bibliotecaFilmesCacheada.slice(0, 40);
                const promessasCreditos = bibliotecaFilmesCacheada.map(filme => 
                    fetch(`${URL_TMDB}movie/${filme.id}/credits?api_key=${APIKEY_TMDB}`).then(res => res.json().catch(() => null))
                );
                const listaCreditos = await Promise.all(promessasCreditos);
                bibliotecaFilmesCacheada.forEach((filme, index) => {
                    const creditos = listaCreditos[index];
                    if (creditos && creditos.crew) {
                        const diretorInfo = creditos.crew.find(membro => membro.job === "Director");
                        if (diretorInfo) filme.diretor = diretorInfo.name;
                    }
                });
                bibliotecaFilmesCacheada.sort((a, b) => {
                    const compDiretor = a.diretor.localeCompare(b.diretor);
                    if (compDiretor !== 0) return compDiretor;
                    return a.anoNumero - b.anoNumero;
                });
            }
        }

        const indiceInicio = (pagina - 1) * itensPorPagina;
        const indiceFim = indiceInicio + itensPorPagina;
        const resultadosPaginados = bibliotecaFilmesCacheada.slice(indiceInicio, indiceFim);
        const totalPaginasCalculado = Math.ceil(bibliotecaFilmesCacheada.length / itensPorPagina) || 1;

        return { resultados: resultadosPaginados, totalPaginas: totalPaginasCalculado };
    } catch (error) {
        console.error("Erro na busca do TMDB:", error);
        return { resultados: [], totalPaginas: 1 };
    }
};



// ==========================================
// 3. RENDERIZAÇÃO DA INTERFACE (DOM)
// ==========================================

// SUBSTITUA TODA A FUNÇÃO criarCard NA SEÇÃO 3:
const criarCard = (filme) => {
    const card = document.createElement("div");
    card.classList.add("card");

    // Define os valores padrão iniciais (Filme)
    let textoBadge = "Filme";
    let classeBadge = "badge-filme";

    // 1. Verifica se o item pertence à categoria de TV/Séries
    if (filme.apiOrigem === "tv" || filme.apiOrigem === "all") {
        textoBadge = "Série";
        classeBadge = "badge-serie";
        
        // 2. DETECÇÃO INTELIGENTE DE ANIME: 
        // Se a API indicar que o país de origem é o Japão (JP) ou se tiver a tag de animação
        const ehJapones = filme.paisOrigem && filme.paisOrigem.includes("JP");
        const ehAnimacao = filme.generos && filme.generos.includes(16);

        if (ehJapones || ehAnimacao) {
            textoBadge = "Anime";
            classeBadge = "badge-anime";
        }
    }

    card.innerHTML = `
        <div class="poster-wrapper">
            <span class="badge-midia ${classeBadge}">${textoBadge}</span>
            <img src="${filme.poster}" alt="${filme.titulo}">
        </div>
        <div class="card-info">
            <h3>${filme.titulo}</h3>
            <p style="margin-bottom: 2px;">Ano: ${filme.ano}</p>
            ${filme.diretor && filme.diretor !== "Não informado" ? `<p style="color: #3182ce; font-weight: bold; margin-bottom: 12px;">🎬 Dir: ${filme.diretor}</p>` : ''}
            <button class='btn-detalhes'>Detalhes</button>
        </div>
    `;

    const img = card.querySelector("img");
    img.addEventListener("error", function handleImgError() {
        img.removeEventListener("error", handleImgError); 
        img.src = posterPadrao;
    });

    const btnDetalhes = card.querySelector(".btn-detalhes");
    btnDetalhes.addEventListener("click", () => exibirDetalhes(filme.id, filme.apiOrigem));
    return card;
};


const exibirDetalhes = async (id, apiOrigem) => {
    if (document.querySelector(".modal")) return;

    let tituloFinal = "";
    let sinopseFinal = "";
    let informacoesExtras = "";

    try {
        if (apiOrigem === "omdb") {
            const response = await fetch(URL_OMDB + "&i=" + id);
            const data = await response.json();
            tituloFinal = data.Title || "Sem título";
            sinopseFinal = data.Plot || "Sinopse não disponível.";
            informacoesExtras = `<p><strong>Diretor:</strong> ${data.Director || "Não informado"}</p><p><strong>Elenco:</strong> ${data.Actors || "Não informado"}</p>`;
        } else {
            const response = await fetch(URL_TMDB + "movie/" + id + "?api_key=" + APIKEY_TMDB + "&language=pt-BR");
            const data = await response.json();
            tituloFinal = data.title || "Sem título";
            sinopseFinal = data.overview;

            // Fallback para inglês caso a sinopse em português esteja vazia
            if (!sinopseFinal || sinopseFinal.trim() === "") {
                const responseEng = await fetch(URL_TMDB + "movie/" + id + "?api_key=" + APIKEY_TMDB + "&language=en-US");
                const dataEng = await responseEng.json();
                sinopseFinal = dataEng.overview || "Sinopse não disponível em nenhum idioma.";
            }
            
            const notaFormatada = (data.vote_average && data.vote_average > 0) 
                ? `⭐ ${data.vote_average.toFixed(1)}/10` 
                : "Nenhuma avaliação";

            informacoesExtras = `<p><strong>Nota dos usuários:</strong> ${notaFormatada}</p>`;
        }

        const modal = document.createElement("div");
        modal.classList.add("modal");
        modal.innerHTML = `
            <div class='modal-content'>
                <h3>${tituloFinal}</h3>
                <p>${sinopseFinal}</p>
                <div class="modal-meta">${informacoesExtras}</div>
                <button class='btn-fechar'>Fechar</button>
            </div>
        `;

        modal.addEventListener("click", (e) => {
            if (e.target.classList.contains("modal") || e.target.classList.contains("btn-fechar")) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);

    } catch (error) {
        console.error("Erro ao carregar modal:", error);
    }
};

// ==========================================
// 4. GERENCIAMENTO DE CARREGAMENTO E BUSCAS
// ==========================================
window.addEventListener("DOMContentLoaded", async () => {
    const mainArea = document.querySelector("main");
    if(!mainArea) return;

    const inputBusca = document.getElementById("input-busca");
    const btnBusca = document.getElementById("btn-busca");
    const btnLimpar = document.getElementById("btn-limpar");

    if (inputBusca) inputBusca.focus();

    let paginaAtual = 1;
    let temporizadorDebounce;

    // Harry Potter por padrão
    const categorias = [
        { titulo: "Filmes em Alta ", rota: "trending/movie/day" },
        { titulo: "Séries e Animes em Destaque", rota: "trending/tv/day"},
    ];


        // Gera a estrutura HTML de um único card esqueleto
    function criarCardSkeleton() {
        const skeleton = document.createElement("div");
        skeleton.classList.add("card-skeleton");
        skeleton.innerHTML = `
            <div class="skeleton-foto"></div>
            <div class="skeleton-info">
                <div class="skeleton-titulo"></div>
                <div class="skeleton-ano"></div>
                <div class="skeleton-botao"></div>
            </div>
        `;
        return skeleton;
    }

    // Enche o container com a quantidade de skeletons desejada
    function exibirSkeletons(container, quantidade = 6) {
        container.innerHTML = ""; // Limpa o container antes
        for (let i = 0; i < quantidade; i++) {
            container.appendChild(criarCardSkeleton());
        }
    }


   async function carregarCategoriasPadrao() {
        mainArea.innerHTML = "";
        
        const paginacaoAntiga = document.querySelector(".paginacao-container");
        if(paginacaoAntiga) paginacaoAntiga.remove();

        for (const categoria of categorias) {
            const h2 = document.createElement("h2");
            h2.textContent = categoria.titulo;
            mainArea.appendChild(h2);

            const cardsContainer = document.createElement("div");
            cardsContainer.classList.add("cards");
            cardsContainer.classList.add("grade-pesquisa"); 
            mainArea.appendChild(cardsContainer);

            exibirSkeletons(cardsContainer, 5);
        

            try {
                // ROTA DINÂMICA: Busca direto nas tendências do dia do TMDB
                const url = `${URL_TMDB}${categoria.rota}?api_key=${APIKEY_TMDB}&language=pt-BR&page=1`;

                const response = await fetch(url);
                if (!response.ok) throw new Error();
                const data = await response.json();

                let filmesPadronizados = [];

                if (data.results) {
                    filmesPadronizados = data.results.map(item => {
                        // Captura as datas de lançamento dinâmicas
                        const dataCrua = item.release_date || item.first_air_date || "";
                        const anoPuro = (dataCrua && dataCrua.length >= 4) ? dataCrua.substring(0, 4) : "N/A";
                        
                        return {
                            id: item.id,
                            titulo: item.title || item.name || "Sem título",
                            ano: anoPuro,
                            anoNumero: dataCrua ? parseInt(anoPuro, 10) : 9999,
                            poster: item.poster_path ? (URL_IMAGEM_TMDB + item.poster_path) : posterPadrao,
                            // Descobre se o item retornado pela rota 'all' é filme (movie) ou série (tv)
                            apiOrigem: item.media_type || "tv",
                            generos: item.genre_ids || [],
                            paisOrigem: item.origin_country || []
                        };
                    });

                    // NOTA DE USABILIDADE: Em listas de destaques diários, mantemos a ordem de popularidade 
                    // original da API (o nº 1 do mundo fica em primeiro) para fazer sentido com o "Em Alta".
                }
                cardsContainer.innerHTML = "";

                if (filmesPadronizados && filmesPadronizados.length > 0) {
                    // Exibe os 6 maiores sucessos mundiais do dia em cada fileira
                    const limiteMaximo = 10;
                    filmesPadronizados.slice(0, limiteMaximo).forEach((filme) => {
                        cardsContainer.appendChild(criarCard(filme));
                    });
                } else {
                    cardsContainer.innerHTML = "<p class='erro-mensagem'>Nenhum destaque encontrado.</p>";
                }   

            } catch (err) {
                console.error(`Erro ao carregar categoria ${categoria.titulo}:`, err);
                // Se der erro na API, remove os skeletons para a tela não ficar travada piscando
                cardsContainer.innerHTML = "<p class='erro-mensagem'>Erro ao carregar dados da API.</p>";
            }

        }
    }

    async function realizarPesquisa(novaPagina = 1) {
        paginaAtual = novaPagina;
        const termoPesquisado = inputBusca.value.trim();

        if (termoPesquisado === "") {
            carregarCategoriasPadrao();
            return;
        }

        mainArea.innerHTML = "";

        const headerResultados = document.createElement("div");
        headerResultados.classList.add("secao-header");
        headerResultados.innerHTML = `
            <h2>Resultados para <span class="termo-destaque">"${termoPesquisado}"</span></h2>
            <span class="badge-pagina">Página ${paginaAtual}</span>
        `;
        mainArea.appendChild(headerResultados);

        const cardsContainer = document.createElement("div");
        cardsContainer.classList.add("cards");
        mainArea.appendChild(cardsContainer);


        const { resultados, totalPaginas } = await buscaTMDBOrdenado(termoPesquisado, paginaAtual);
        

        if (resultados && resultados.length > 0) {
            resultados.forEach((filme)=> {
                cardsContainer.appendChild(criarCard(filme));
            });
            renderizarControlesPaginacao(totalPaginas);
        } else {
            const pErro = document.createElement("p");
            pErro.textContent = "Nenhum filme encontrado nas bases de dados.";
            pErro.className = "erro-mensagem";
            cardsContainer.appendChild(pErro);
        }
    }

    function renderizarControlesPaginacao(totalPaginas) {
        const antiga = document.querySelector(".paginacao-container");
        if(antiga) antiga.remove();

        if (totalPaginas <= 1) return;

        const container = document.createElement("div");
        container.classList.add("paginacao-container");

        const btnAnterior = document.createElement("button");
        btnAnterior.textContent = "◀ Anterior";
        btnAnterior.disabled = paginaAtual === 1;
        btnAnterior.addEventListener("click", () => {
            realizarPesquisa(paginaAtual - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        const infoPagina = document.createElement("span");
        infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;

        const btnProxima = document.createElement("button");
        btnProxima.textContent = "Próxima ▶";
        btnProxima.disabled = paginaAtual === totalPaginas;
        btnProxima.addEventListener("click", () => {
            realizarPesquisa(paginaAtual + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        container.appendChild(btnAnterior);
        container.appendChild(infoPagina);
        container.appendChild(btnProxima);
        mainArea.appendChild(container);
    }

    if (inputBusca && btnLimpar) {
        inputBusca.addEventListener("input", () => {
            const termo = inputBusca.value.trim();
            btnLimpar.style.display = termo !== "" ? "block" : "none";

            clearTimeout(temporizadorDebounce);
            temporizadorDebounce = setTimeout(() => {
                if (termo === "") {
                    carregarCategoriasPadrao();
                } else {
                    realizarPesquisa(1); 
                }
            }, 500);
        });

        const selectOrdenacao = document.getElementById("select-ordenacao");
        if (selectOrdenacao) {
            selectOrdenacao.addEventListener("change", () => {
                const termo = inputBusca.value.trim();
                if(termo === "") {
                    carregarCategoriasPadrao();
                } else {
                    realizarPesquisa(1);
                }
            });
        }

        btnLimpar.addEventListener("click", () => {
            clearTimeout(temporizadorDebounce);
            inputBusca.value = "";
            btnLimpar.style.display = "none";
            carregarCategoriasPadrao();
            inputBusca.focus();
        });
    }

    await carregarCategoriasPadrao();
    btnBusca.addEventListener("click", () => realizarPesquisa(1));
    inputBusca.addEventListener("keypress", (e) => {
        if (e.key === "Enter") realizarPesquisa(1);
    });
});


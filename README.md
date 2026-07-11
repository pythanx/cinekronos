# CineCronos

Um catálogo de filmes, séries e animes que organiza tudo em ordem cronológica. Perfeito pra maratonar suas franquias favoritas!

## Funcionalidades

-  **Busca inteligente**: Encontre filmes, séries e animes com um clique
-  **Identificação automática**: Cada mídia recebe uma etiqueta (Filme, Série ou Anime)
-  **Ordenação cronológica**: Organize por ano de lançamento
-  **Ordenação por diretor**: Veja os filmes organizados pelo diretor
-  **Design responsivo**: Funciona em qualquer dispositivo
-  **Tema escuro**: Estilo Netflix pra você maratonar sem cansar a vista

## Como usar

1. Acesse o site: [CineCronos](https://pythanx.github.io/cinekronos)
2. Digite o nome do filme, série ou anime na barra de pesquisa
3. Escolha como quer organizar os resultados
4. Clique em "Detalhes" pra ver mais informações

## 🛠️ Tecnologias usadas

- HTML5
- CSS3 (com animações e Grid)
- JavaScript (Vanilla)
- [TMDB API](https://www.themoviedb.org/) - Dados de filmes e séries
- [OMDB API](http://www.omdbapi.com/) - Detalhes e informações extras
- GitHub Actions (Deploy automático)

## Segurança

As chaves de API são injetadas automaticamente durante o deploy via GitHub Actions. O código fonte é público, mas as chaves ficam protegidas nos Secrets do GitHub.

## Estrutura do projeto

```
cinekronos/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Configuração do deploy automático
├── index.html                      # Página principal
├── script.js                       # Toda a lógica do site
├── styles.css                      # Estilos e animações
├── favicon.png                     # Ícone do site
├── injeta-chaves.sh                # Script que injeta as chaves no deploy
└── README.md                       # Esse arquivo
```
## Desenvolvido por

<<<<<<<<< Temporary merge branch 1
[Gis](https://github.com/pythanx)
=========
[Gis](https://github.com/pythanx) - Criador e desenvolvedor do projeto
>>>>>>>>> Temporary merge branch 2

## Agradecimentos

- [TMDB](https://www.themoviedb.org/) - Pela base de dados incrível
- [OMDB](http://www.omdbapi.com/) - Pelas informações complementares
- [GitHub Pages](https://pages.github.com/) - Pelo hosting gratuito

---

**Divirta-se explorando!** 🍿
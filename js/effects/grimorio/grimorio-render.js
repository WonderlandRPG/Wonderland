"use strict";

/*
=========================================================
WONDERLAND RPG
GRIMÓRIO RENDER ENGINE
=========================================================
*/

window.Grimorio = window.Grimorio || {};

Grimorio.Render = (()=>{

    /*==============================*/

    function render(termo){

        if(!termo) return;

        Wonderland.Theme.apply(

            termo.tema

        );

        Wonderland.Effects.play(

            termo.tema.efeito

        );

        Wonderland.Render.replace(

            termContent,

            ()=>{

                termContent.innerHTML = `

                <div class="grimorio-card">

                    <div class="grimorio-header">

                        <div class="grimorio-symbol">

                            ✦

                        </div>

                        <div>

                            <h1>

                                ${termo.nome}

                            </h1>

                            <span>

                                ${termo.subtitulo}

                            </span>

                        </div>

                    </div>

                    <div class="grimorio-divider"></div>

                    <section>

                        <h2>

                            Descrição

                        </h2>

                        <p>

                            ${termo.descricao}

                        </p>

                    </section>

                    <section>

                        <h2>

                            Funcionamento

                        </h2>

                        <ul>

                            ${renderList(

                                termo.funcionamento

                            )}

                        </ul>

                    </section>

                    <section>

                        <h2>

                            Exemplo

                        </h2>

                        <p>

                            ${termo.exemplo}

                        </p>

                    </section>

                    <section>

                        <h2>

                            Utilizado por

                        </h2>

                        <ul>

                            ${
                                termo.utilizadoPor.length

                                ?

                                renderList(

                                    termo.utilizadoPor

                                )

                                :

                                "<li>Em desenvolvimento.</li>"
                            }

                        </ul>

                    </section>

                    <section>

                        <h2>

                            Observações

                        </h2>

                        <ul>

                            ${renderList(

                                termo.observacoes

                            )}

                        </ul>

                    </section>

                </div>

                `;

            }

        );

    }

    /*==============================*/

    function renderList(lista){

        return lista

            .map(item=>

                `<li>${item}</li>`

            )

            .join("");

    }

    /*==============================*/

    return{

        render

    };

})();
import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { ZipArchive } from 'archiver';

const CAPITULOS = [1, 2, 3];

/**
 * Cada subseção fala de um tema diferente e sem relação com os outros — o
 * fixture serve também para testar busca semântica (Fase 3): uma consulta
 * sobre um desses temas precisa achar a seção certa, e uma consulta fora de
 * todos eles precisa voltar vazia.
 */
const TOPICOS: Record<string, string> = {
  '1-1':
    'Fotossíntese é o processo pelo qual plantas convertem luz solar em ' +
    'energia química. Cloroplastos usam clorofila para captar fótons e ' +
    'produzir glicose a partir de água e dióxido de carbono.',
  '1-2':
    'O ciclo da água descreve o movimento contínuo da água entre a ' +
    'atmosfera, a superfície terrestre e os oceanos. Evaporação, ' +
    'condensação e precipitação são as três etapas principais desse ciclo.',
  '2-1':
    'A Revolução Francesa começou em 1789 e derrubou a monarquia ' +
    'absolutista, instaurando ideais de liberdade, igualdade e ' +
    'fraternidade que influenciaram movimentos políticos em todo o mundo.',
  '2-2':
    'A independência do Brasil foi proclamada em 1822 por Dom Pedro I, ' +
    'encerrando o domínio colonial português e dando início ao primeiro ' +
    'Império Brasileiro.',
  '3-1':
    'Aprendizado de máquina é um ramo da inteligência artificial em que ' +
    'algoritmos aprendem padrões a partir de dados, sem serem programados ' +
    'explicitamente para cada tarefa.',
  '3-2':
    'Redes de computadores conectam dispositivos para troca de dados ' +
    'usando protocolos como TCP/IP, permitindo comunicação entre máquinas ' +
    'em diferentes partes do mundo.',
};

function paginaCapitulo(numero: number): string {
  const subsecoes = [1, 2]
    .map(
      (sub) => `
<section id="sub${sub}">
<h2>Capítulo ${numero}.${sub}</h2>
<p>${TOPICOS[`${numero}-${sub}`]}</p>
</section>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Capítulo ${numero}</title></head>
<body>
<h1 id="cap${numero}">Capítulo ${numero}</h1>${subsecoes}
</body>
</html>
`;
}

function nav(): string {
  const itens = CAPITULOS.map(
    (numero) => `
  <li><a href="cap${numero}.xhtml">Capítulo ${numero}</a>
    <ol>
      <li><a href="cap${numero}.xhtml#sub1">Capítulo ${numero}.1</a></li>
      <li><a href="cap${numero}.xhtml#sub2">Capítulo ${numero}.2</a></li>
    </ol>
  </li>`,
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Sumário</title></head>
<body>
<nav epub:type="toc" id="toc">
<ol>${itens}
</ol>
</nav>
</body>
</html>
`;
}

function opf(): string {
  const manifest = CAPITULOS.map(
    (numero) =>
      `    <item id="cap${numero}" href="cap${numero}.xhtml" media-type="application/xhtml+xml"/>`,
  ).join('\n');
  const spine = CAPITULOS.map(
    (numero) => `    <itemref idref="cap${numero}"/>`,
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">urn:uuid:livro-teste-oria</dc:identifier>
    <dc:title>Livro de Teste da Oria</dc:title>
    <dc:creator>Autoria de Teste</dc:creator>
    <dc:language>pt-BR</dc:language>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
${manifest}
  </manifest>
  <spine>
${spine}
  </spine>
</package>
`;
}

const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`;

/**
 * Monta um EPUB 3 válido e determinístico: três capítulos, duas subseções
 * cada, texto curto. Usado pelos testes automatizados (Fase 1 em diante) e
 * pela ingestão (Fase 2). Um EPUB válido é um ZIP com "mimetype" não
 * comprimido como primeira entrada — por isso `archiver` em vez de montar o
 * ZIP na mão.
 */
export async function gerarFixtureEpub(destino: string): Promise<void> {
  mkdirSync(dirname(destino), { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const saida = createWriteStream(destino);
    const arquivo = new ZipArchive({ zlib: { level: 9 } });

    saida.on('close', () => resolve());
    arquivo.on('error', reject);
    arquivo.pipe(saida);

    arquivo.append('application/epub+zip', { name: 'mimetype', store: true });
    arquivo.append(CONTAINER_XML, { name: 'META-INF/container.xml' });
    arquivo.append(opf(), { name: 'OEBPS/content.opf' });
    arquivo.append(nav(), { name: 'OEBPS/nav.xhtml' });

    for (const numero of CAPITULOS) {
      arquivo.append(paginaCapitulo(numero), {
        name: `OEBPS/cap${numero}.xhtml`,
      });
    }

    void arquivo.finalize();
  });
}

if (require.main === module) {
  const destino =
    process.argv[2] ?? `${__dirname}/../test/fixtures/livro-teste.epub`;

  gerarFixtureEpub(destino)
    .then(() => {
      console.log(`Fixture EPUB gerado em ${destino}`);
    })
    .catch((erro: unknown) => {
      console.error(erro);
      process.exit(1);
    });
}

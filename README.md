#  Diário de Lugares

Aplicativo mobile desenvolvido com **React Native e Expo** que permite registrar lugares visitados por meio de fotografias, descrições e localização geográfica opcional.

O objetivo do projeto é proporcionar uma maneira simples e organizada de guardar lembranças de lugares especiais, permitindo que o usuário consulte seus registros posteriormente em uma galeria pessoal.

---

##  Sobre o projeto

O **Diário de Lugares** é um aplicativo de registro pessoal de locais visitados. O usuário pode fotografar um lugar, adicionar um título, escrever uma descrição e, se desejar, registrar suas coordenadas geográficas.

Os registros ficam armazenados localmente no dispositivo, permitindo consultar as informações salvas sem precisar de uma conta ou de um banco de dados remoto.

##  Objetivos

- Facilitar o registro de lugares visitados.
- Permitir o armazenamento de fotografias e descrições.
- Oferecer uma galeria organizada dos registros.
- Permitir a consulta dos detalhes de cada lugar.
- Possibilitar a obtenção da localização geográfica.
- Garantir que o registro possa ser salvo mesmo quando a localização não estiver disponível.

##  Funcionalidades

###  Registro de lugares

- Informar o nome do lugar.
- Adicionar uma descrição.
- Tirar uma fotografia utilizando a câmera do dispositivo.
- Salvar o registro no armazenamento local.
- Registrar automaticamente a data e o horário do cadastro.

### Câmera

- Solicitar permissão para acessar a câmera.
- Exibir a câmera para fotografar o lugar.
- Permitir cancelar a captura.
- Exibir uma prévia da fotografia antes de salvar o registro.

###  Localização geográfica

- Solicitar permissão para acessar a localização do dispositivo.
- Obter latitude e longitude quando disponíveis.
- Permitir salvar registros sem localização.
- Informar quando um registro não possui coordenadas geográficas.

###  Minha galeria

- Exibir os lugares registrados em uma grade de fotografias.
- Mostrar o nome e a data de cada registro.
- Indicar se o registro possui localização.
- Abrir os detalhes de um lugar selecionado.
- Excluir registros quando necessário.

###  Armazenamento local

Os registros são armazenados no dispositivo utilizando o AsyncStorage.

As informações salvas incluem:

- Identificador do registro.
- Nome do lugar.
- Descrição.
- Caminho da fotografia.
- Data e horário do registro.
- Latitude, quando disponível.
- Longitude, quando disponível.

---

##  Tecnologias utilizadas

| Tecnologia | Finalidade |
|---|---|
| React Native | Desenvolvimento da interface mobile |
| Expo | Execução e gerenciamento do aplicativo |
| TypeScript | Tipagem e organização do código |
| Expo Camera | Acesso à câmera do dispositivo |
| Expo Location | Obtenção da localização geográfica |
| AsyncStorage | Armazenamento local dos registros |
| JavaScript | Base da programação utilizada pelo React Native |
| JSX/TSX | Construção dos componentes e interfaces |

---

## 📋 Pré-requisitos

Antes de executar o projeto, é necessário ter instalado:

- [Node.js](https://nodejs.org/)
- [Visual Studio Code](https://code.visualstudio.com/) ou outro editor de código.
- Android Studio, caso deseje utilizar um emulador Android.
- Git, caso deseje clonar o repositório.

Também é necessário ter acesso ao terminal para executar os comandos de instalação e inicialização.

---

##  Como instalar e executar

### 1. Clonar o repositório

Caso o projeto esteja disponível em um repositório Git, execute:

```bash
git clone URL_DO_REPOSITORIO
```

Substitua `URL_DO_REPOSITORIO` pelo endereço real do repositório.

Se você já possui o projeto no computador, pode pular esta etapa.

### 2. Entrar na pasta do projeto

```bash
cd diario-de-lugares
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Instalar as bibliotecas utilizadas

```bash
npx expo install expo-camera expo-location @react-native-async-storage/async-storage
```

### 5. Iniciar o aplicativo

```bash
npx expo start
```

Após a inicialização, o Expo exibirá as opções para abrir o aplicativo.

**Para utilizar o emulador Android:** inicie o emulador no Android Studio e pressione `a` no terminal do Expo.

**Para utilizar um celular físico:** instale o Expo Go no aparelho e siga as instruções exibidas pelo Expo. O computador e o celular normalmente precisam estar conectados à mesma rede Wi-Fi.

---

##  Como utilizar o aplicativo

### 1. Registrar um lugar

1. Abra o aplicativo.
2. Acesse a tela **Registrar**.
3. Digite o nome do lugar.
4. Adicione uma descrição, se desejar.
5. Abra a câmera e tire uma fotografia.
6. Obtenha a localização, caso queira registrar as coordenadas.
7. Toque em **Salvar lugar**.

O nome e a fotografia são obrigatórios. A descrição e a localização são opcionais.

### 2. Consultar a galeria

1. Acesse a opção **Minha galeria**.
2. Visualize os lugares registrados.
3. Selecione uma fotografia para abrir os detalhes.
4. Consulte a descrição, a data e a localização, quando disponível.

### 3. Excluir um registro

1. Abra a galeria.
2. Selecione o lugar que deseja excluir.
3. Toque em **Excluir registro**.
4. Confirme a exclusão.

---

##  Estrutura do projeto

A estrutura principal esperada é semelhante à seguinte:

```text
diario-de-lugares/
├── assets/
├── node_modules/
├── App.tsx
├── app.json
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

**Observação:** a estrutura pode variar de acordo com os arquivos existentes no projeto.

| Arquivo ou pasta | Descrição |
|---|---|
| `App.tsx` | Componente principal e funcionalidades do aplicativo |
| `assets/` | Recursos estáticos, como imagens e ícones, quando utilizados |
| `app.json` | Configurações do Expo |
| `package.json` | Dependências e comandos do projeto |
| `package-lock.json` | Registro das versões das dependências instaladas |
| `tsconfig.json` | Configurações do TypeScript |
| `README.md` | Documentação do projeto |
| `node_modules/` | Bibliotecas instaladas pelo npm |

---

## Permissões

O aplicativo pode solicitar as seguintes permissões:

- **Câmera:** necessária para fotografar os lugares.
- **Localização:** utilizada para obter as coordenadas geográficas.

A permissão de localização é opcional para o funcionamento do aplicativo. Caso não seja concedida, o usuário ainda poderá registrar e consultar os lugares normalmente.

---

##  Persistência dos dados

O aplicativo utiliza o AsyncStorage para guardar os registros localmente.

Isso significa que os dados não são enviados automaticamente para um servidor ou banco de dados remoto.

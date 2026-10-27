import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions, type CameraView as CameraViewType } from 'expo-camera';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';

type Lugar = {
  id: string;
  titulo: string;
  descricao: string;
  foto: string;
  latitude: number;
  longitude: number;
  data: string;
};

const CHAVE = '@diario_de_lugares/registros';

type Aba = 'registrar' | 'galeria';

export default function App() {
  const cameraRef = useRef<CameraViewType | null>(null);
  const [permissaoCamera, pedirPermissaoCamera] = useCameraPermissions();
  const [aba, setAba] = useState<Aba>('registrar');
  const [cameraAberta, setCameraAberta] = useState(false);
  const [cameraPronta, setCameraPronta] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ latitude: number; longitude: number } | null>(null);
  const [carregandoLocalizacao, setCarregandoLocalizacao] = useState(false);
  const [registros, setRegistros] = useState<Lugar[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [lugarSelecionado, setLugarSelecionado] = useState<Lugar | null>(null);

  useEffect(() => {
    carregarRegistros();
  }, []);

  async function carregarRegistros() {
    try {
      const dados = await AsyncStorage.getItem(CHAVE);
      if (dados) setRegistros(JSON.parse(dados) as Lugar[]);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os registros salvos.');
    }
  }

  async function obterLocalizacao() {
    setCarregandoLocalizacao(true);
    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso à localização para registrar onde você está.');
        return;
      }

      const servicosAtivos = await Location.hasServicesEnabledAsync();
      if (!servicosAtivos) {
        Alert.alert('GPS desligado', 'Ative a localização nas configurações do Android e tente novamente.');
        return;
      }

      const local = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoordenadas({
        latitude: local.coords.latitude,
        longitude: local.coords.longitude,
      });
      Alert.alert('Localização obtida', 'A localização foi registrada para este lugar.');
    } catch {
      Alert.alert(
        'Não foi possível obter a localização',
        'Confira se a localização está ativada no emulador e tente novamente.'
      );
    } finally {
      setCarregandoLocalizacao(false);
    }
  }

  async function abrirCamera() {
    if (!permissaoCamera?.granted) {
      const resultado = await pedirPermissaoCamera();
      if (!resultado.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso à câmera para fotografar um lugar.');
        return;
      }
    }

    setFoto(null);
    setCameraPronta(false);
    setCameraAberta(true);
  }

  async function tirarFoto() {
    if (!cameraRef.current || !cameraPronta) {
      Alert.alert('Aguarde', 'A câmera ainda está iniciando.');
      return;
    }

    try {
      const resultado = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (resultado?.uri) {
        setFoto(resultado.uri);
        setCameraAberta(false);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível tirar a foto. Tente novamente.');
    }
  }

  async function salvarRegistro() {
    if (!titulo.trim()) {
      Alert.alert('Falta o título', 'Digite um nome para este lugar.');
      return;
    }

    if (!foto) {
      Alert.alert('Falta a foto', 'Tire uma foto do lugar antes de salvar.');
      return;
    }

    if (!coordenadas) {
      Alert.alert('Falta a localização', 'Toque em “Obter localização” antes de salvar.');
      return;
    }

    setSalvando(true);

    try {
      const novo: Lugar = {
        id: `${Date.now()}`,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        foto,
        latitude: coordenadas.latitude,
        longitude: coordenadas.longitude,
        data: new Date().toISOString(),
      };

      const atualizados = [novo, ...registros];

      await AsyncStorage.setItem(CHAVE, JSON.stringify(atualizados));

      setRegistros(atualizados);
      setTitulo('');
      setDescricao('');
      setFoto(null);
      setCoordenadas(null);
      setCameraAberta(false);
      setAba('galeria');

      Alert.alert('Salvo!', 'O lugar foi adicionado à sua galeria.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar este lugar no celular.');
    } finally {
      setSalvando(false);
    }
  }

  function excluirRegistro(id: string) {
    Alert.alert('Excluir registro', 'Deseja apagar este lugar do diário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const atualizados = registros.filter((item) => item.id !== id);
          await AsyncStorage.setItem(CHAVE, JSON.stringify(atualizados));
          setRegistros(atualizados);
          setLugarSelecionado(null);
        },
      },
    ]);
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <View style={styles.topo}>
        <Text style={styles.marca}>📍 Diário de Lugares</Text>
        <Text style={styles.subtituloTopo}>Suas lembranças, em cada lugar.</Text>
      </View>

      <View style={styles.abas}>
        <TouchableOpacity
          style={[styles.aba, aba === 'registrar' && styles.abaAtiva]}
          onPress={() => setAba('registrar')}
        >
          <Text style={[styles.textoAba, aba === 'registrar' && styles.textoAbaAtiva]}>
            ＋ Registrar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.aba, aba === 'galeria' && styles.abaAtiva]}
          onPress={() => setAba('galeria')}
        >
          <Text style={[styles.textoAba, aba === 'galeria' && styles.textoAbaAtiva]}>
            ▦ Minha galeria ({registros.length})
          </Text>
        </TouchableOpacity>
      </View>

      {aba === 'registrar' ? (
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introCartao}>
            <Text style={styles.tituloTela}>Registre um momento</Text>
            <Text style={styles.textoIntro}>
              Tire uma foto, marque onde você está e guarde essa lembrança.
            </Text>
          </View>

          <View style={styles.cartao}>
            <Text style={styles.rotulo}>Nome do lugar *</Text>
            <TextInput
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ex.: Praça central"
              style={styles.input}
              maxLength={70}
            />

            <Text style={styles.rotulo}>Descrição / lembrança</Text>
            <TextInput
              value={descricao}
              onChangeText={setDescricao}
              placeholder="O que você quer lembrar deste lugar?"
              style={[styles.input, styles.textarea]}
              multiline
              maxLength={300}
            />

            {cameraAberta ? (
              <View>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="back"
                  onCameraReady={() => setCameraPronta(true)}
                />

                <TouchableOpacity style={styles.botaoPrincipal} onPress={tirarFoto}>
                  <Text style={styles.textoBotaoPrincipal}>📸 Tirar foto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoClaro}
                  onPress={() => setCameraAberta(false)}
                >
                  <Text style={styles.textoBotaoClaro}>Cancelar câmera</Text>
                </TouchableOpacity>
              </View>
            ) : foto ? (
              <View>
                <Image source={{ uri: foto }} style={styles.fotoPreview} />

                <TouchableOpacity style={styles.botaoClaro} onPress={abrirCamera}>
                  <Text style={styles.textoBotaoClaro}>Tirar outra foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.areaFoto} onPress={abrirCamera}>
                <Text style={styles.iconeFoto}>📷</Text>
                <Text style={styles.areaFotoTitulo}>Adicionar fotografia</Text>
                <Text style={styles.areaFotoTexto}>Toque para abrir a câmera</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.botaoClaro, coordenadas && styles.botaoLocalOk]}
              onPress={obterLocalizacao}
              disabled={carregandoLocalizacao}
            >
              <Text style={styles.textoBotaoClaro}>
                {carregandoLocalizacao
                  ? 'Obtendo localização...'
                  : coordenadas
                    ? '✓ Localização obtida'
                    : '📍 Obter localização GPS'}
              </Text>
            </TouchableOpacity>

            {coordenadas && (
              <Text style={styles.coordenadas}>
                Latitude: {coordenadas.latitude.toFixed(6)} · Longitude:{' '}
                {coordenadas.longitude.toFixed(6)}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.botaoPrincipal, salvando && styles.desativado]}
              onPress={salvarRegistro}
              disabled={salvando}
            >
              <Text style={styles.textoBotaoPrincipal}>
                {salvando ? 'Salvando...' : '💾 Salvar no diário'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.observacao}>
              * A foto e a localização são necessárias para salvar um registro.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          contentContainerStyle={styles.galeriaConteudo}
          data={registros}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={registros.length ? styles.linhaGaleria : undefined}
          ListHeaderComponent={
            <View style={styles.cabecalhoGaleria}>
              <Text style={styles.tituloTela}>Minha galeria</Text>
              <Text style={styles.textoIntro}>
                Todas as suas lembranças em um só lugar.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Text style={styles.vazioIcone}>🖼️</Text>
              <Text style={styles.vazioTitulo}>Sua galeria está vazia</Text>
              <Text style={styles.vazioTexto}>
                Registre seu primeiro lugar para ver as fotos aqui.
              </Text>

              <TouchableOpacity
                style={styles.botaoPrincipal}
                onPress={() => setAba('registrar')}
              >
                <Text style={styles.textoBotaoPrincipal}>＋ Registrar primeiro lugar</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cartaoFoto}
              onPress={() => setLugarSelecionado(item)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: item.foto }} style={styles.miniatura} />

              <View style={styles.infoFoto}>
                <Text style={styles.nomeFoto} numberOfLines={1}>
                  {item.titulo}
                </Text>
                <Text style={styles.dataFoto}>{formatarData(item.data)}</Text>
                <Text style={styles.localFoto}>
                  📍 {item.latitude.toFixed(3)}, {item.longitude.toFixed(3)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={!!lugarSelecionado}
        animationType="slide"
        onRequestClose={() => setLugarSelecionado(null)}
      >
        {lugarSelecionado && (
          <View style={styles.modalTela}>
            <TouchableOpacity
              style={styles.fecharModal}
              onPress={() => setLugarSelecionado(null)}
            >
              <Text style={styles.fecharModalTexto}>‹ Voltar à galeria</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.detalheConteudo}>
              <Image
                source={{ uri: lugarSelecionado.foto }}
                style={styles.fotoGrande}
              />

              <Text style={styles.detalheTitulo}>{lugarSelecionado.titulo}</Text>

              {!!lugarSelecionado.descricao && (
                <Text style={styles.detalheDescricao}>
                  {lugarSelecionado.descricao}
                </Text>
              )}

              <View style={styles.detalheInfo}>
                <Text style={styles.detalheInfoTexto}>
                  📅 {formatarData(lugarSelecionado.data)}
                </Text>
                <Text style={styles.detalheInfoTexto}>
                  📍 Latitude: {lugarSelecionado.latitude.toFixed(6)}
                </Text>
                <Text style={styles.detalheInfoTexto}>
                  Longitude: {lugarSelecionado.longitude.toFixed(6)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.botaoExcluir}
                onPress={() => excluirRegistro(lugarSelecionado.id)}
              >
                <Text style={styles.textoExcluir}>Excluir registro</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f4f6fb' },
  topo: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 15,
  },
  marca: { fontSize: 25, fontWeight: '800', color: '#233d68' },
  subtituloTopo: { fontSize: 13, color: '#718096', marginTop: 5 },
  abas: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e7ebf2',
  },
  aba: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  abaAtiva: { borderBottomColor: '#4169b2' },
  textoAba: { color: '#7b8798', fontWeight: '700', fontSize: 13 },
  textoAbaAtiva: { color: '#3157a4' },
  conteudo: { padding: 16, paddingBottom: 36 },
  introCartao: { marginBottom: 14 },
  tituloTela: { fontSize: 23, fontWeight: '800', color: '#233d68' },
  textoIntro: {
    color: '#68778d',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
  },
  cartao: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    elevation: 2,
  },
  rotulo: {
    color: '#344054',
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 9,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dce3ee',
    borderRadius: 11,
    padding: 13,
    fontSize: 15,
    backgroundColor: '#fbfcff',
    color: '#172033',
  },
  textarea: { minHeight: 82, textAlignVertical: 'top' },
  areaFoto: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#a9bad7',
    borderRadius: 14,
    backgroundColor: '#f7f9fe',
    padding: 24,
    alignItems: 'center',
    marginTop: 14,
  },
  iconeFoto: { fontSize: 34 },
  areaFotoTitulo: {
    color: '#3157a4',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 7,
  },
  areaFotoTexto: { color: '#78869b', fontSize: 12, marginTop: 4 },
  botaoPrincipal: {
    backgroundColor: '#3157a4',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  textoBotaoPrincipal: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  botaoClaro: {
    backgroundColor: '#eaf0fb',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBotaoClaro: { color: '#244780', fontWeight: '800', fontSize: 14 },
  botaoLocalOk: { backgroundColor: '#e3f6eb' },
  camera: {
    height: 310,
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 12,
  },
  fotoPreview: {
    height: 240,
    borderRadius: 13,
    marginTop: 14,
    resizeMode: 'cover',
  },
  coordenadas: {
    color: '#536780',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 9,
    textAlign: 'center',
  },
  observacao: {
    color: '#8490a2',
    fontSize: 11,
    marginTop: 12,
    lineHeight: 17,
  },
  desativado: { opacity: 0.6 },
  galeriaConteudo: {
    paddingHorizontal: 14,
    paddingBottom: 30,
    flexGrow: 1,
  },
  cabecalhoGaleria: { paddingVertical: 19 },
  linhaGaleria: { justifyContent: 'space-between' },
  cartaoFoto: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 13,
    elevation: 2,
  },
  miniatura: {
    width: '100%',
    height: 155,
    backgroundColor: '#e3e8f0',
  },
  infoFoto: { padding: 10 },
  nomeFoto: { color: '#233d68', fontSize: 15, fontWeight: '800' },
  dataFoto: { color: '#7b8798', fontSize: 11, marginTop: 5 },
  localFoto: { color: '#536780', fontSize: 10, marginTop: 5 },
  vazio: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 25,
    marginTop: 8,
  },
  vazioIcone: { fontSize: 43 },
  vazioTitulo: {
    color: '#233d68',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  vazioTexto: {
    color: '#78869b',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 7,
  },
  modalTela: { flex: 1, backgroundColor: '#f4f6fb' },
  fecharModal: {
    paddingHorizontal: 18,
    paddingVertical: 17,
    backgroundColor: '#ffffff',
  },
  fecharModalTexto: { color: '#3157a4', fontSize: 16, fontWeight: '800' },
  detalheConteudo: { padding: 18, paddingBottom: 40 },
  fotoGrande: {
    width: '100%',
    height: 360,
    borderRadius: 17,
    backgroundColor: '#e3e8f0',
  },
  detalheTitulo: {
    color: '#233d68',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 18,
  },
  detalheDescricao: {
    color: '#4f5f75',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 9,
  },
  detalheInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 15,
    marginTop: 18,
  },
  detalheInfoTexto: { color: '#536780', fontSize: 13, marginVertical: 4 },
  botaoExcluir: {
    borderWidth: 1,
    borderColor: '#efc5c5',
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 15,
  },
  textoExcluir: { color: '#b42318', fontWeight: '800' },
});
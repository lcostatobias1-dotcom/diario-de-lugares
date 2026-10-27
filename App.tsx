import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';

type Lugar = {
  id: string;
  titulo: string;
  descricao: string;
  foto: string;
  data: string;
  latitude: number | null;
  longitude: number | null;
};

export default function App() {
  const [tela, setTela] = useState<'registrar' | 'galeria'>('registrar');
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [coordenadas, setCoordenadas] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [cameraAberta, setCameraAberta] = useState(false);
  const [lugarSelecionado, setLugarSelecionado] = useState<Lugar | null>(null);
  const [carregando, setCarregando] = useState(false);

  const [permissaoCamera, solicitarPermissaoCamera] =
    useCameraPermissions();

  useEffect(() => {
    carregarLugares();
  }, []);

  async function carregarLugares() {
    try {
      const dados = await AsyncStorage.getItem('@diario_lugares');

      if (dados) {
        setLugares(JSON.parse(dados));
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os registros.');
    }
  }

  async function salvarNoArmazenamento(novosLugares: Lugar[]) {
    await AsyncStorage.setItem(
      '@diario_lugares',
      JSON.stringify(novosLugares)
    );

    setLugares(novosLugares);
  }

  async function obterLocalizacao() {
    try {
      const permissao =
        await Location.requestForegroundPermissionsAsync();

      if (permissao.status !== 'granted') {
        setCoordenadas(null);
        return;
      }

      const local = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoordenadas({
        latitude: local.coords.latitude,
        longitude: local.coords.longitude,
      });
    } catch {
      setCoordenadas(null);
    }
  }

  async function abrirCamera() {
    if (!permissaoCamera?.granted) {
      const resultado = await solicitarPermissaoCamera();

      if (!resultado.granted) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à câmera para fotografar um lugar.'
        );
        return;
      }
    }

    setCameraAberta(true);
  }

  async function tirarFoto() {
    // A fotografia é capturada pelo componente CameraView.
  }

  const cameraRef = React.useRef<CameraView>(null);

  async function capturarFoto() {
    try {
      const imagem = await cameraRef.current?.takePictureAsync();

      if (imagem?.uri) {
        setFoto(imagem.uri);
        setCameraAberta(false);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  }

  async function salvarRegistro() {
    if (!titulo.trim()) {
      Alert.alert('Atenção', 'Digite o nome do lugar.');
      return;
    }

    if (!foto) {
      Alert.alert('Atenção', 'Tire uma foto antes de salvar.');
      return;
    }

    setCarregando(true);

    try {
      let localizacao = coordenadas;

      // A localização é opcional. Se falhar, o registro será salvo mesmo assim.
      if (!localizacao) {
        try {
          const permissao =
            await Location.getForegroundPermissionsAsync();

          if (permissao.status === 'granted') {
            const local = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });

            localizacao = {
              latitude: local.coords.latitude,
              longitude: local.coords.longitude,
            };
          }
        } catch {
          localizacao = null;
        }
      }

      const novoLugar: Lugar = {
        id: Date.now().toString(),
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        foto,
        data: new Date().toISOString(),
        latitude: localizacao?.latitude ?? null,
        longitude: localizacao?.longitude ?? null,
      };

      const novosLugares = [novoLugar, ...lugares];

      await salvarNoArmazenamento(novosLugares);

      setTitulo('');
      setDescricao('');
      setFoto(null);
      setCoordenadas(null);

      Alert.alert('Sucesso', 'Lugar registrado com sucesso!');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o registro.');
    } finally {
      setCarregando(false);
    }
  }

  async function excluirLugar(id: string) {
    Alert.alert(
      'Excluir registro',
      'Deseja realmente excluir este lugar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const novosLugares = lugares.filter(
                (lugar) => lugar.id !== id
              );

              await salvarNoArmazenamento(novosLugares);
              setLugarSelecionado(null);
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir o registro.');
            }
          },
        },
      ]
    );
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleString('pt-BR');
  }

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <Text style={styles.tituloApp}>Diário de Lugares</Text>
        <Text style={styles.subtitulo}>
          Guarde as lembranças dos lugares que você visita.
        </Text>
      </View>

      <View style={styles.navegacao}>
        <TouchableOpacity
          style={[
            styles.botaoNavegacao,
            tela === 'registrar' && styles.botaoAtivo,
          ]}
          onPress={() => setTela('registrar')}
        >
          <Text
            style={[
              styles.textoNavegacao,
              tela === 'registrar' && styles.textoAtivo,
            ]}
          >
            Registrar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.botaoNavegacao,
            tela === 'galeria' && styles.botaoAtivo,
          ]}
          onPress={() => setTela('galeria')}
        >
          <Text
            style={[
              styles.textoNavegacao,
              tela === 'galeria' && styles.textoAtivo,
            ]}
          >
            Minha galeria ({lugares.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tela === 'registrar' ? (
        <ScrollView
          style={styles.conteudo}
          contentContainerStyle={styles.conteudoInterno}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.tituloSecao}>Registrar um lugar</Text>

          <Text style={styles.rotulo}>Nome do lugar *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: Parque da cidade"
            value={titulo}
            onChangeText={setTitulo}
          />

          <Text style={styles.rotulo}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.inputDescricao]}
            placeholder="Conte um pouco sobre este lugar..."
            value={descricao}
            onChangeText={setDescricao}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.rotulo}>Fotografia *</Text>

          {foto ? (
            <View>
              <Image source={{ uri: foto }} style={styles.fotoPreview} />

              <TouchableOpacity
                style={styles.botaoSecundario}
                onPress={abrirCamera}
              >
                <Text style={styles.textoBotaoSecundario}>
                  Tirar outra foto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoRemoverFoto}
                onPress={() => setFoto(null)}
              >
                <Text style={styles.textoRemoverFoto}>
                  Remover fotografia
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.areaFoto}
              onPress={abrirCamera}
            >
              <Text style={styles.iconeCamera}>📷</Text>
              <Text style={styles.textoAreaFoto}>
                Abrir câmera
              </Text>
              <Text style={styles.textoAjuda}>
                Tire uma foto do lugar visitado.
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.rotulo}>Localização</Text>

          <TouchableOpacity
            style={styles.botaoSecundario}
            onPress={obterLocalizacao}
          >
            <Text style={styles.textoBotaoSecundario}>
              📍 Obter minha localização
            </Text>
          </TouchableOpacity>

          {coordenadas ? (
            <Text style={styles.textoLocalizacao}>
              Latitude: {coordenadas.latitude.toFixed(5)}{"\n"}
              Longitude: {coordenadas.longitude.toFixed(5)}
            </Text>
          ) : (
            <Text style={styles.textoAjuda}>
              Opcional. Você pode salvar o registro sem localização.
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.botaoSalvar,
              carregando && styles.botaoDesabilitado,
            ]}
            onPress={salvarRegistro}
            disabled={carregando}
          >
            <Text style={styles.textoBotaoSalvar}>
              {carregando ? 'Salvando...' : 'Salvar lugar'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.conteudo}
          contentContainerStyle={styles.galeria}
        >
          <Text style={styles.tituloSecao}>Minha galeria</Text>

          {lugares.length === 0 ? (
            <View style={styles.vazio}>
              <Text style={styles.iconeVazio}>🗺️</Text>
              <Text style={styles.textoVazio}>
                Você ainda não registrou nenhum lugar.
              </Text>
              <Text style={styles.textoAjuda}>
                Seus registros aparecerão aqui.
              </Text>
            </View>
          ) : (
            <View style={styles.grade}>
              {lugares.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.cartao}
                  onPress={() => setLugarSelecionado(item)}
                >
                  <Image
                    source={{ uri: item.foto }}
                    style={styles.fotoCartao}
                  />

                  <View style={styles.informacoesCartao}>
                    <Text style={styles.nomeCartao} numberOfLines={1}>
                      {item.titulo}
                    </Text>

                    <Text style={styles.dataCartao}>
                      {new Date(item.data).toLocaleDateString('pt-BR')}
                    </Text>

                    <Text style={styles.localCartao}>
                      {item.latitude != null &&
                      item.longitude != null
                        ? '📍 Localização salva'
                        : '📍 Sem localização'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={cameraAberta}
        animationType="slide"
        onRequestClose={() => setCameraAberta(false)}
      >
        <View style={styles.telaCamera}>
          {permissaoCamera?.granted ? (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
            >
              <View style={styles.controlesCamera}>
                <TouchableOpacity
                  style={styles.botaoFecharCamera}
                  onPress={() => setCameraAberta(false)}
                >
                  <Text style={styles.textoBotaoCamera}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoCapturar}
                  onPress={capturarFoto}
                >
                  <View style={styles.circuloCapturar} />
                </TouchableOpacity>
              </View>
            </CameraView>
          ) : (
            <View style={styles.permissaoNegada}>
              <Text style={styles.textoPermissao}>
                A câmera precisa de permissão para funcionar.
              </Text>

              <TouchableOpacity
                style={styles.botaoSalvar}
                onPress={async () => {
                  const resultado = await solicitarPermissaoCamera();

                  if (resultado.granted) {
                    setCameraAberta(true);
                  } else {
                    Alert.alert(
                      'Permissão negada',
                      'Autorize o acesso à câmera nas configurações do aparelho.'
                    );
                  }
                }}
              >
                <Text style={styles.textoBotaoSalvar}>
                  Solicitar permissão
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoSecundario}
                onPress={() => setCameraAberta(false)}
              >
                <Text style={styles.textoBotaoSecundario}>
                  Voltar
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <Modal
        visible={lugarSelecionado !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setLugarSelecionado(null)}
      >
        <View style={styles.fundoModal}>
          <View style={styles.conteudoModal}>
            {lugarSelecionado && (
              <ScrollView>
                <Image
                  source={{ uri: lugarSelecionado.foto }}
                  style={styles.fotoDetalhe}
                />

                <Text style={styles.tituloDetalhe}>
                  {lugarSelecionado.titulo}
                </Text>

                <Text style={styles.dataDetalhe}>
                  📅 {formatarData(lugarSelecionado.data)}
                </Text>

                <Text style={styles.descricaoDetalhe}>
                  {lugarSelecionado.descricao ||
                    'Nenhuma descrição adicionada.'}
                </Text>

                {lugarSelecionado.latitude != null &&
                lugarSelecionado.longitude != null ? (
                  <Text style={styles.localDetalhe}>
                    📍 Latitude: {lugarSelecionado.latitude.toFixed(5)}
                    {'\n'}
                    Longitude: {lugarSelecionado.longitude.toFixed(5)}
                  </Text>
                ) : (
                  <Text style={styles.localDetalhe}>
                    📍 Localização não registrada.
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.botaoFecharDetalhe}
                  onPress={() => setLugarSelecionado(null)}
                >
                  <Text style={styles.textoBotaoSalvar}>
                    Fechar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoExcluir}
                  onPress={() => excluirLugar(lugarSelecionado.id)}
                >
                  <Text style={styles.textoBotaoSalvar}>
                    Excluir registro
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  cabecalho: {
    backgroundColor: '#356859',
    paddingTop: 55,
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  tituloApp: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#E4F0E9',
    fontSize: 14,
    marginTop: 6,
  },
  navegacao: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E6E3',
  },
  botaoNavegacao: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  botaoAtivo: {
    borderBottomWidth: 3,
    borderBottomColor: '#356859',
  },
  textoNavegacao: {
    color: '#66736C',
    fontSize: 14,
    fontWeight: '600',
  },
  textoAtivo: {
    color: '#356859',
  },
  conteudo: {
    flex: 1,
  },
  conteudoInterno: {
    padding: 20,
    paddingBottom: 40,
  },
  tituloSecao: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#263A32',
    marginBottom: 22,
  },
  rotulo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#34473D',
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E1DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#263A32',
  },
  inputDescricao: {
    height: 110,
  },
  areaFoto: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7D8CE',
    borderStyle: 'dashed',
    borderRadius: 12,
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconeCamera: {
    fontSize: 36,
    marginBottom: 8,
  },
  textoAreaFoto: {
    color: '#356859',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textoAjuda: {
    color: '#7B8981',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
  },
  fotoPreview: {
    width: '100%',
    height: 230,
    borderRadius: 12,
    marginBottom: 10,
  },
  botaoSecundario: {
    backgroundColor: '#E5EFE9',
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBotaoSecundario: {
    color: '#356859',
    fontWeight: 'bold',
    fontSize: 14,
  },
  botaoRemoverFoto: {
    alignItems: 'center',
    padding: 10,
  },
  textoRemoverFoto: {
    color: '#B23B3B',
    fontSize: 14,
  },
  textoLocalizacao: {
    color: '#356859',
    fontSize: 13,
    marginTop: 10,
    lineHeight: 21,
  },
  botaoSalvar: {
    backgroundColor: '#356859',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  textoBotaoSalvar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  galeria: {
    padding: 16,
    paddingBottom: 40,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cartao: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
  },
  fotoCartao: {
    width: '100%',
    height: 145,
    backgroundColor: '#E5EAE7',
  },
  informacoesCartao: {
    padding: 10,
  },
  nomeCartao: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#263A32',
  },
  dataCartao: {
    fontSize: 12,
    color: '#758078',
    marginTop: 6,
  },
  localCartao: {
    fontSize: 11,
    color: '#356859',
    marginTop: 6,
  },
  vazio: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  iconeVazio: {
    fontSize: 48,
    marginBottom: 15,
  },
  textoVazio: {
    color: '#34473D',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  telaCamera: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  controlesCamera: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 25,
    paddingBottom: 45,
  },
  botaoFecharCamera: {
    backgroundColor: '#333333',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
  },
  textoBotaoCamera: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  botaoCapturar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloCapturar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
  },
  permissaoNegada: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#FFFFFF',
  },
  textoPermissao: {
    color: '#263A32',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 15,
  },
  fundoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  conteudoModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    maxHeight: '90%',
  },
  fotoDetalhe: {
    width: '100%',
    height: 230,
    borderRadius: 10,
    marginBottom: 16,
  },
  tituloDetalhe: {
    color: '#263A32',
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dataDetalhe: {
    color: '#758078',
    fontSize: 13,
    marginBottom: 16,
  },
  descricaoDetalhe: {
    color: '#34473D',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 16,
  },
  localDetalhe: {
    color: '#356859',
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 12,
  },
  botaoFecharDetalhe: {
    backgroundColor: '#356859',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  botaoExcluir: {
    backgroundColor: '#B23B3B',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
});
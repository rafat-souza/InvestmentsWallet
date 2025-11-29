import { View, Text } from 'react-native';

export default function About() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Essa é uma carteira de investimentos pensada para 
        investidores agressivos/arrojados, onde você pode registrar suas compras e vendas de ativos de renda variável 
        e analisar a distribuição do seu patrimônio, preço médio, e muito mais.
      </Text>
      <Text>Versão 1.0.0</Text>
    </View>
  );
}
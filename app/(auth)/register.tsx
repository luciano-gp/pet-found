import DateTimePicker from '@react-native-community/datetimepicker';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterScreen() {
  // Campos comuns
  const [name, setName] = useState('');
  const { signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  //State se é ou não ONG
  const [isOng, setIsOng] = useState(false);

  // Campos extras para ONG
  const [ongDescription, setOngDescription] = useState('');
  const [ongCnpj, setOngCnpj] = useState('');

  // Campos extras para usuário normal
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!email) newErrors.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email inválido';

    if (!password) newErrors.password = 'Senha é obrigatória';
    else if (password.length < 6) newErrors.password = 'Senha deve ter pelo menos 6 caracteres';

    if (!confirmPassword) newErrors.confirmPassword = 'Confirme sua senha';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Senhas não coincidem';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await signUp({
        email,
        password,
        fullname: name,
        type: isOng ? 'ong' : 'user',
        ...(isOng
          ? { ong: 
              {
                description: ongDescription, 
                cnpj: ongCnpj } }
          : {
              normalUser: {
                cpf: cpf,
                birth_date: birthDate ? birthDate.toISOString().split('T')[0] : undefined,
              },
            }),
      });

      Alert.alert(
        'Sucesso',
        'Conta criada com sucesso! Você será redirecionado para a tela principal.',
        [{ text: 'OK', onPress: () => router.replace('/(app)') }]
      );
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao criar conta');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Preencha os dados para se cadastrar</Text>

          <View style={styles.form}>
            {/* Toggle de tipo de conta */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Usuário</Text>
              <Switch
                value={isOng}
                onValueChange={setIsOng}
                thumbColor={isOng ? '#007AFF' : '#f4f3f4'}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
              />
              <Text style={styles.toggleLabel}>ONG</Text>
            </View>

            {/* Nome comum para todos */}
            <Input label="Nome" value={name} onChangeText={setName} placeholder="Digite seu nome" />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Digite seu email"
              keyboardType="email-address"
              error={errors.email}
            />

            <Input
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Digite sua senha"
              secureTextEntry
              error={errors.password}
            />

            <Input
              label="Confirmar Senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirme sua senha"
              secureTextEntry
              error={errors.confirmPassword}
            />

            {/* Campos extras aparecem conforme tipo */}
            {isOng ? (
              <>
                <Input label="CNPJ" value={ongCnpj} onChangeText={setOngCnpj} placeholder="Digite o CNPJ" />

                <Input
                  label="Descrição"
                  value={ongDescription}
                  onChangeText={setOngDescription}
                  placeholder="Digite a descrição da ONG"
                  multiline
                />
                
              </>
            ) : (
  <>
    <Input label="CPF" value={cpf} onChangeText={setCpf} placeholder="Digite seu CPF" />

    <Pressable onPress={() => setShowDatePicker(true)}>
      <View pointerEvents="none">
        <Input
          label="Data de Nascimento"
          value={birthDate ? birthDate.toLocaleDateString('pt-BR') : ''}
          placeholder="DD/MM/AAAA"
          editable={false}
        />
      </View>
    </Pressable>

    {showDatePicker && (
      <DateTimePicker
        value={birthDate || new Date(2000, 0, 1)}
        mode="date"
        display="spinner"
        maximumDate={new Date()}
        onChange={(event, selectedDate) => {
          setShowDatePicker(false);
          if (event.type === 'set' && selectedDate) {
            setBirthDate(selectedDate);
          }
        }}
      />
    )}
  </>
            )}

            <Button
              title="Cadastrar"
              onPress={handleRegister}
              loading={loading}
              disabled={!email || !password || !confirmPassword || !name}
              variant="primary"
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Já tem uma conta? </Text>
              <Link href="/(auth)/login" asChild>
                <Text style={styles.link}>Faça login</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingVertical: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
  form: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  toggleLabel: { fontSize: 16, color: '#333', marginHorizontal: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: '#666' },
  link: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
});

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DetailsPage, DetailsCard, DetailSection, DetailGrid, DetailValue, DetailsFooter } from '../../components/details/Details';
import api from '../../services/api';
import { mascaraTelefone } from '../../utils/mascaraTelefone';

export default function CustomerDetails() {
  const { id } = useParams();
  return <CustomerDetailsContent key={id} id={id} />;
}

function CustomerDetailsContent({ id }) {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { data } = await api.get('/clientes', { signal: controller.signal });
        if (controller.signal.aborted) return;
        const record = data.find(item => item._id === id);
        setCustomer(record || null);
        if (!record) setError('Cliente não encontrado.');
      } catch {
        if (!controller.signal.aborted) setError('Não foi possível carregar o cliente.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [id, attempt]);

  return <DetailsPage
    title="Detalhes do cliente"
    subtitle="Informações de contato e observações do cliente."
    onBack={() => navigate('/clientes')}
    loading={loading} loadingMessage="Carregando cliente..." error={error}
    onRetry={!loading && !customer ? () => { setLoading(true); setError(''); setAttempt(value => value + 1); } : undefined}
  >
    {!loading && customer && <DetailsCard title={customer.nome} subtitle="Dados do cliente">
      <DetailSection title="Informações de contato">
        <DetailGrid>
          <DetailValue label="Nome" value={customer.nome} />
          <DetailValue label="Telefone / WhatsApp" value={customer.telefone ? mascaraTelefone(customer.telefone) : 'Não informado'} />
          <DetailValue label="Instagram" value={customer.instagram || 'Não informado'} />
        </DetailGrid>
      </DetailSection>
      <DetailSection title="Observações">
        <DetailGrid>
          <DetailValue label="Observações sobre o cliente" value={<span className="whitespace-pre-wrap">{customer.observacoes || 'Nenhuma observação cadastrada.'}</span>} />
        </DetailGrid>
      </DetailSection>
      <DetailsFooter createdAt={customer.createdAt} updatedAt={customer.updatedAt} />
    </DetailsCard>}
  </DetailsPage>;
}

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    TextField,
    Typography,
    IconButton,
    Box,
    Alert,
    Autocomplete
} from '@mui/material';
import { Trash, Plus } from 'lucide-react';
// Re-ordered import for debugging
import { adminAPI } from '../services/api';

const CommissionModal = ({ open, onClose, onSave, initialCommissions = [] }) => {
    const [users, setUsers] = useState([]);
    const [commissions, setCommissions] = useState(initialCommissions);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            fetchUsers();
            // Se não houver comissões iniciais, comece vazio ou conforme lógica desejada
            setCommissions(initialCommissions.length > 0 ? initialCommissions : []);
        }
    }, [open, initialCommissions]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await adminAPI.getCommissionUsers();
            // Filtrar apenas usuários elegíveis
            setUsers(data.filter(u => u.isCommissionEligible));
        } catch (err) {
            console.error('Erro ao buscar usuários:', err);
            setError('Erro ao carregar lista de usuários.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = () => {
        setCommissions([...commissions, { userId: null, percent: '' }]);
    };

    const handleRemoveUser = (index) => {
        const newCommissions = [...commissions];
        newCommissions.splice(index, 1);
        setCommissions(newCommissions);
    };

    const handleUserChange = (index, newValue) => {
        const newCommissions = [...commissions];
        newCommissions[index].userId = newValue ? newValue.id : null;
        newCommissions[index].userLabel = newValue ? newValue.name : ''; // Opcional para display
        setCommissions(newCommissions);
    };

    const handlePercentChange = (index, value) => {
        const newCommissions = [...commissions];
        newCommissions[index].percent = value;
        setCommissions(newCommissions);
    };

    const handleSave = () => {
        // Validação
        let totalPercent = 0;
        const validCommissions = [];

        for (const comm of commissions) {
            if (!comm.userId) {
                setError('Selecione o usuário para todas as linhas.');
                return;
            }
            const p = parseFloat(comm.percent);
            if (isNaN(p) || p <= 0) {
                setError('Percentual deve ser maior que zero.');
                return;
            }
            totalPercent += p;
            validCommissions.push({ userId: comm.userId, percent: p });
        }

        if (Math.abs(totalPercent - 100) > 0.1 && validCommissions.length > 0) {
            setError(`A soma das porcentagens deve ser 100%. Atual: ${totalPercent}%`);
            return;
        }

        onSave(validCommissions);
        onClose();
    };

    const availableUsers = (currentIndex) => {
        // Retorna usuários que ainda não foram selecionados em outras linhas
        const selectedIds = commissions
            .map((c, idx) => idx !== currentIndex ? c.userId : null)
            .filter(id => id !== null);

        return users.filter(u => !selectedIds.includes(u.id));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Atribuir Comissão Compartilhada</DialogTitle>
            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                        Adicione os usuários que dividirão a comissão deste(s) pedido(s).
                        A soma das porcentagens deve totalizar 100% da comissão configurada.
                    </Typography>
                </Box>

                <List>
                    {commissions.map((comm, index) => (
                        <ListItem key={index} sx={{ px: 0, gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Autocomplete
                                    options={availableUsers(index)}
                                    getOptionLabel={(option) => option.name || option.email}
                                    value={users.find(u => u.id === comm.userId) || null}
                                    onChange={(_, newValue) => handleUserChange(index, newValue)}
                                    renderInput={(params) => <TextField {...params} label="Usuário" size="small" />}
                                    noOptionsText="Nenhum usuário disponível"
                                />
                            </Box>
                            <TextField
                                label="%"
                                type="number"
                                size="small"
                                sx={{ width: 80 }}
                                value={comm.percent}
                                onChange={(e) => handlePercentChange(index, e.target.value)}
                                InputProps={{ inputProps: { min: 0, max: 100 } }}
                            />
                            <IconButton onClick={() => handleRemoveUser(index)} color="error" size="small">
                                <Trash size={18} />
                            </IconButton>
                        </ListItem>
                    ))}
                </List>

                <Button
                    startIcon={<Plus size={16} />}
                    onClick={handleAddUser}
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ mt: 1 }}
                >
                    Adicionar Beneficiário
                </Button>

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    Confirmar Atribuição
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CommissionModal;

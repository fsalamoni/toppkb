import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  defaultNS: 'common',
  resources: {
    'pt-BR': {
      common: {
        app: {
          name: 'Top Pickleball 50+',
          tagline: 'Sua plataforma para ser o melhor 50+ do Brasil em 2032',
        },
        auth: {
          login: 'Entrar com link mágico',
          logout: 'Sair',
          email: 'E-mail',
        },
        actions: {
          save: 'Salvar',
          cancel: 'Cancelar',
          delete: 'Deletar',
          edit: 'Editar',
          new: 'Novo',
        },
      },
    },
  },
  interpolation: { escapeValue: false },
});

export default i18n;

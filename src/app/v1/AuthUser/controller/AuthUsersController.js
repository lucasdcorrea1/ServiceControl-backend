'use strict'
require('dotenv/config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const authRepository = require('../repository/AuthUsersRepository');
const { generateToken } = require('../../../../helpers/jwtServices');
const mailer = require('../../../../modules/mailer');
const { UseUserEnum } = require('../../../../enums/UserEnums');
const userEnum = UseUserEnum();

module.exports = {
  async create(request, response) {
    try {
      const data = {
        email: request.body.email.trim(),
        password: request.body.password.trim(),
      };

      const user = await authRepository.getUserByEmail(data.email);
      if (!user)
        return response.status(400).json({
          message: 'E-mail ou senha inválidos!'
        });

      if (!await bcrypt.compare(data.password, user.password))
        return response.status(400).json({
          message: 'E-mail ou senha inválidos!'
        });
      user.password = undefined;

      if (user.status !== userEnum.status.active) {
        let message;
        user.status === userEnum.status.blocked ?
          message = 'Usuário bloqueado, por favor entre em contato com seu supervisor.'
          :
          message = 'Usuário pendente de aprovação, por favor entre em contato com seu supervisor.';
        return response.status(400).json({
          message
        });
      }

      const token = await generateToken({ user: user });

      return response.status(200).json({
        token: token,
        name: user.name,
        email: user.email,
        type: user.type,
      });
    } catch (error) {
      
      return response.status(400).json({
        message: error
      });
    }
  },

  async forgotPassword(request, response) {
    try {
      const data = {
        email: request.body.email.trim(),
      };

      const user = await authRepository.getUserByEmail(data.email);

      if (!user)
        return response.status(400).json({ message: 'Usuário não encontrado!' });

      const token = crypto.randomBytes(20).toString('hex');

      const now = new Date();
      now.setHours(now.getHours() + 1);

      await authRepository.put(
        {
          id: user.id, data: {
            passwordResetToken: token,
            passwordResetExpires: now,
          }
        }
      );

      const name = user.name;
      mailer.sendMail({
        to: `${user.email}, ${process.env.GMAIL_USER}`,
        from: '"Service Control" <service.controlLDC@gmail.com>',
        subject: `Ei, ${name}, você precisa alterar sua senha?`,
        template: 'auth/forgotPassword',
        context: {
          name,
          token
        },
      });

      return response.status(200).json({
        message: `Enviamos o token de autorização para o e-mail ${data.email}`
      });

    } catch (error) {
      return response.status(400).json({ message: `Erro ao solicitar troca de senha ${error}` });
    };
  },

  async update(request, response) {
    try {
      const data = {
        email: request.body.email.trim(),
        token: request.body.token.trim(),
        password: request.body.password.trim(),
      };
      const now = new Date();
      const user = await authRepository.getUserByEmail(data.email);

      if (!user)
        return response.status(400).json({ message: 'Usuário não encontrado.' });

      if (data.token !== user.passwordResetToken)
        return response.status(400).json({ message: 'Token inválido.' });

      if (!now > user.passwordResetExpires)
        return response.status(400).json({ message: 'Token expirado.' });

      if (await bcrypt.compare(data.password, user.password))
        return response.status(400).json({ message: 'Utilize uma senha diferente da atual!' });

      data.password = await bcrypt.hash(data.password, 10);

      await authRepository.put(
        {
          id: user.id, data: {
            password: data.password,
            passwordResetToken: null,
            passwordResetExpires: null,
          }
        });

      user.password = undefined;

      return response.status(200).json({ message: 'Senha atualizada com sucesso.' });
    } catch (error) {

      response.status(400).json({ message: `Erro ao resetar senha: ${error}` });
    }
  }
};
'use strict';
const { UseUserEnum } = require('../../../../enums/UserEnums');
const userEnum = UseUserEnum();


module.exports = {
	async validTypePerson(userTypePerson) {
		let typePerson;
		userTypePerson === userEnum.typePerson.fisical || userTypePerson === userEnum.typePerson.legal ?
			typePerson = userTypePerson
			:
			typePerson = userEnum.typePerson.legal;

		return typePerson;
	},

	async validPostType(requestType) {
		let userType;
		requestType === userEnum.type.superUser ||
			requestType === userEnum.type.admin ||
			requestType === userEnum.type.user ||
			requestType === userEnum.type.client ?
			userType = true
			:
			userType = false;

		return userType;
	},

	async validateUserRegistrationType(tokenUserType, postUserType) {
		if (tokenUserType === userEnum.type.superUser) {
			return true;
		}

		if (tokenUserType === userEnum.type.admin) {
			if (postUserType !== userEnum.type.superUser) {
				return true;
			}
			return false;
		};

		if (tokenUserType === userEnum.type.user ||
			tokenUserType === userEnum.type.client) {
			return false;

		}

		return false;
	},

	async statusIsValid(requestStatus) {
		if (requestStatus === userEnum.status.pending ||
			requestStatus === userEnum.status.active ||
			requestStatus === userEnum.status.blocked) {

			return true;
		}

		return false;
	},

	async filterUserStatus(users, status) {
		let userFilter = [];

		users && status ? userFilter = users.filter(function (item) {
			return item.status.toString() === status;
		}) : false;
		return userFilter;
	},

	async constructorObjectUpdate(userdata) {
		let userUpdate = {};

		userdata.name !== undefined ? userUpdate.name = userdata.name.trim() : false;
		userdata.email !== undefined ? userUpdate.email = userdata.email.trim() : false;
		userdata.cpfCnpj !== undefined ? userUpdate.cpfCnpj = userdata.cpfCnpj : false;
		userdata.typePerson !== undefined ? userUpdate.typePerson = userdata.typePerson : false;
		userdata.status !== undefined ? userUpdate.status = userdata.status : false;

		return userUpdate;
	}
};
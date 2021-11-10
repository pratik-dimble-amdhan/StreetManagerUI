sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
    "project1/model/models",
    "sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
    "sap/ui/core/BusyIndicator",
    "project1/services/configHelper",
	"project1/services/ajaxCaller",
	"project1/services/apiFacade",
], function (UIComponent, Device, models ,JSONModel, MessageBox, BusyIndicator, ConfigHelper, AjaxCaller, ApiFacade) {
   
	"use strict";

	return UIComponent.extend("project1.Component", {

	metadata: {
			manifest: "json"
		},
		pageCtrl: "",
		tileClicked: null,
		oBusyDialog: null,
		CSRFToken: null,

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
            this.setModel(models.createDeviceModel(), "device");
            
			// initialize singleton services
			this._initializeBaseObjectSingletonClasses();

			//Call BackEnd and set User Profile Model
			this.setUserProfileModel();

			//Set listener for session end
			this.setSessionCheck();

			//Busy Dialog
			this.oBusyDialog = new sap.m.BusyDialog();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			this.setmainModel();
			this.setRegistrationModel();
			this.setInspectionModel();
			this.setCreateInspectionModel();
			this.setPermitHistoryModel();
			this.setPermitCancelModel();
			this.setPermitExtendModel();
			this.setPermitRevertModel();
			this.setPermitJointingModel();

		
        },
        
        setmainModel: function () {
			this.setModel(models.createModel(), "oModel");
		},

		setRegistrationModel: function () {
			this.setModel(models.createRegistrationModel(), "RegModel");
		},
		setInspectionModel: function () {
			this.setModel(models.createInspectionModel(), "InsModel");
		},
		setCreateInspectionModel: function () {
			this.setModel(models.createManualInspectionModel(), "CreateManInsModel");
		},

		setPermitHistoryModel: function () {
			this.setModel(models.createPermitHistoryModel(), "PermitHistory");
		},
		setPermitExtendModel: function () {
			this.setModel(models.createExtendPermitModel(), "ExtendPermitModel");
		},

		setPermitCancelModel: function () {
			this.setModel(models.createPermitCancelModel(), "PermitCancelModel");
		},

		setPermitRevertModel: function () {
			this.setModel(models.createPermitRevertModel(), "PermitRevertModel");
		},
		setPermitJointingModel: function () {
			this.setModel(models.createPermitJointingModel(), "PermitJointingModel");
		},

		setSessionCheck: function () {
			$(document).ajaxError(function (oEvent, jqxhr) {
				if (jqxhr.status === 401) {
					var sText = this.getModel("i18n").getResourceBundle().getText("sessionEndMsg");
					MessageBox.warning(sText, {
						onClose: function () {
							window.location.reload(true);
						}
					})
				}
			}.bind(this));
        },

        setUserProfileModel: function () {
			BusyIndicator.show(0);
			ApiFacade.getInstance().getUserProfile()
				.then(function (data) {
					BusyIndicator.hide();
					var bContractor = false;
					if (data.assignedRoles && data.assignedRoles.indexOf("CONTRACTOR") !== -1) {
						bContractor = true;
					}
					data.isContractor = bContractor;
					this.setModel(new JSONModel(data), "UserProfileModel");
					// enable routing
					this.getRouter().initialize();
					if (!data.userId || data.userId === "") {
						var fNoAuth = function () {
							setTimeout(function () {
								MessageBox.error(this.getModel("i18n").getResourceBundle().getText("noAuthMsg", data.username));
							}.bind(this), 500);
							this.getRouter().navTo("NoAuth");
						}.bind(this);
						//Don't allow user to change url
						$(window).hashchange(function () {
							if (window.hasher.getHash().indexOf("NoAuth") === -1) {
								fNoAuth();
							}
						}.bind(this));
						fNoAuth();
					}
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},
        



		/**
		 * Standard function to display ajax call error
		 * @param  {object} oReject Object with error description
		 * @return {undefined}      Nothing to return
		 */
		standardAjaxErrorDisplay: function (oReject) {
			//Check if there are any messages with the error
			if (oReject.error && oReject.error.responseText) {
				var errorMessage = oReject.error.responseText;
			} else if (oReject.responseJSON) {
				var errorMessage = oReject.responseJSON;
			} else {
				var errorMessage = oReject;
			}
			if (typeof errorMessage !== "string") {
				errorMessage = errorMessage.message;
			} else if (this.IsJsonString(errorMessage)) {
				errorMessage = JSON.parse(errorMessage).message;
			}
			var regExp = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;
			if (errorMessage.match(regExp)) {
				var sDate = errorMessage.match(regExp)[0];
				errorMessage = errorMessage.replace(sDate, this.formatter.DateFormatMoment(new Date(sDate)));
			}

			if (oReject.error && oReject.error.status && oReject.error.status === 412) {
				MessageBox.warning(errorMessage, {
					onClose: function () {
						window.location.reload(true);
					}
				});
			} else {
				MessageBox.warning(errorMessage);
			}
		},

		IsJsonString: function (str) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Initialize owner component when necessary
		 * @private
		 * @return {undefined}
		 */
		_initializeBaseObjectSingletonClasses: function () {
			ConfigHelper.getInstance().setOwnerComponent(this);
			ConfigHelper.getInstance().init();
			ApiFacade.getInstance().setOwnerComponent(this);
			AjaxCaller.getInstance().setOwnerComponent(this);
		}

	});
});

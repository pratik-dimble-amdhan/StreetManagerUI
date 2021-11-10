/*global Map XLSX */
sap.ui.define(
	[
		"sap/m/MessageBox",
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/routing/History",
		"sap/ui/model/json/JSONModel",
		"project1/util/Formatter",
		"sap/ui/core/BusyIndicator",
        "project1/services/apiFacade",
        "project1/libs/moment"
	],
	function (MessageBox, Controller, History, JSONModel, formatter, BusyIndicator, ApiFacade,momentjs) {
		"use strict";

		/**
		 * @class
		 * @desc Base object from which all other controllers inherit
		 * @extends sap/ui/core/mvc/Controller
		 * @author Manuel Navarro Ruiz
		 * @constructor
		 * @public
		 * @module SAP/UKPN/UI/PermitApplication/base/BaseController
		 */
		return Controller.extend(
			"com.shell.ds.dis.sent.activation.base.BaseController", /** @lends module:SAP/UKPN/UI/PermitApplication/base/BaseController# */ {
				/**
				 * Shared app formatter
				 * @type {object}
				 */
				formatter: formatter,
				extendPermitDialog: null,
				revertJointingDialog: null,
				completeJointingDialog: null,
				RevertPermitDialog: null,
				/* =========================================================== */
				/* public methods					                           */
				/* =========================================================== */

				/**
				 * Convenience method for accessing the router in every controller of the application.
				 * @public
				 * @returns {sap.ui.core.routing.Router} the router for this component
				 */
				getRouter: function () {
					return this.getOwnerComponent().getRouter();
				},

				/**
				 * Convenience method for getting the view model by name in every controller of the application.
				 * @public
				 * @param {string} sName the model name
				 * @returns {sap.ui.model.Model} the model instance
				 */
				getModel: function (sName) {
					return this.getView().getModel(sName);
				},

				/**
				 * Convenience method for setting the view model in every controller of the application.
				 * @public
				 * @param {sap.ui.model.Model} oModel the model instance
				 * @param {string} sName the model name
				 * @returns {sap.ui.mvc.View} the view instance
				 */
				setModel: function (oModel, sName) {
					return this.getView().setModel(oModel, sName);
				},

				/**
				 * Convenience method for getting the resource bundle.
				 * @public
				 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
				 */
				getResourceBundle: function () {
					return this.getOwnerComponent()
						.getModel("i18n")
						.getResourceBundle();
				},

				/**
				 * Formatter instance
				 * @public
				 * @return {com.shell.ds.dis.sent.activation.app.util.formatter} App formatter
				 */
				getFormatter: function () {
					return this.formatter;
				},

				/**
				 * Do a hardcoded navigation, no parameters needed.
				 * @public
				 * @param  {string} sRouteName Route name defined in 'manifest.json'
				 * @param  {object} oParams It depends how route is defined in 'manifest.json' file
				 * @return {undefined}
				 */
				doNavTo: function (sRouteName, oParams) {
					if (oParams) {
						this.getRouter().navTo(sRouteName, oParams);
					} else {
						this.getRouter().navTo(sRouteName);
					}
				},

				/**
				 * Display the selected target without changing the hash
				 * @public
				 * @param  {string} sTargetNameFrom From target name
				 * @param  {string} sTargetNameTo Destination target name
				 * @param  {object} oParams     Additional data to pass
				 * @return {undefined}
				 */
				doNavToBasedOnTarget: function (
					sTargetNameFrom,
					sTargetNameTo,
					oParams
				) {
					var oDataNavigations = {
						from: sTargetNameFrom,
						data: oParams
					};

					this.getRouter()
						.getTargets()
						.display(sTargetNameTo, oDataNavigations);
				},

				/**
				 * Switch on busy indicator in app screens
				 * @public
				 * @return {undefined}
				 */
				switchOnBusy: function () {
					var oAppViewModel = this.getOwnerComponent().getModel("appView");
					oAppViewModel.setProperty("/busy", true);
				},

				/**
				 * Switch off busy indicator in app screens
				 * @public
				 * @return {undefined}
				 */
				switchOffBusy: function () {
					var oAppViewModel = this.getOwnerComponent().getModel("appView");
					oAppViewModel.setProperty("/busy", false);
				},

				/**
				 * Helper function for retrieving fragments
				 * @public
				 * @param  {string} sProperty     The property in which the control will be stored and retrieved
				 * @param  {string} sFragmentName The fragment name (optional after the first call)
				 * @return {sap.ui.core.Control}  The control insided the fragment
				 */
				getFragment: function (sProperty, sFragmentName) {
					if (!this[sProperty]) {
						this[sProperty] = sap.ui.xmlfragment(sFragmentName, this);
						this.getView().addDependent(this[sProperty]);
					}
				},

				/**
				 * Handle is the object has error messages
				 * @param {object} oData Data
				 * @param {function} fnHandler Close callback
				 * @return {undefined} Nothing to return
				 */
				handleErrors: function (oData, fnHandler) {
					var sMessage = "";
					if (oData.message) {
						sMessage = oData.message;
					} else if (oData.error) {
						if (oData.error.responseJSON) {

							try {
								var sMessageJSON = JSON.parse(oData.error.responseJSON.message);
								sMessage = sMessageJSON.errorMessage || sMessageJSON.message;
							} catch (e) {
								sMessage = oData.error.responseJSON.message;
							}

							var loginUrlPath = this._oConfigData.urls.Authentication.Login.path,
								isLogin = oData.requestUrl.indexOf(loginUrlPath) !== -1;

							if (!isLogin &&
								(oData.error.status === 403 ||
									oData.error.status === 401 ||
									oData.error.status === 404)) {

								// GO TO LOGIN SCREEN
								fnHandler = this._reloadAppToLogin;
							}
						} else if (
							oData.error.responseText &&
							oData.error.responseText !== ""
						) {
							sMessage = oData.error.responseText;
						} else if (oData.error.statusText && oData.error.statusText !== "") {
							sMessage = oData.error.statusText;
						}
					}

					if (sMessage === "") {
						return false;
					}

					this.showMessage(sMessage, "E", fnHandler);
					return true;
				},

				/* =========================================================== */
				/* event handlers                                              */
				/* =========================================================== */

				/**
				 * Event handler for navigating back.
				 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
				 * If not, it will replace the current entry of the browser history with the master route.
				 * @public
				 * @return {undefined}
				 */
				onNavBack: function (bWarning) {
					var oHistory = History.getInstance(),
						sPreviousHash = oHistory.getPreviousHash();
					var fNav = function(){
						if (sPreviousHash !== undefined) {
							history.go(-1);
						} else {
							this.doNavTo("TargetView1");
						}
					}.bind(this);
					if(bWarning){
						MessageBox.confirm(
							this.getResourceBundle().getText("dataLostWarning"), {
							actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
							onClose: function (oAction) {
								if (oAction === MessageBox.Action.OK) {
									fNav();
								}
							}.bind(this)
						}
						);
					}else{
						fNav();
					}
				},

				/**
				 * Event handler for navigating back.
				 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
				 * If not, it will replace the current entry of the browser history with the master route.
				 * @public
				 * @return {undefined}
				 */
				onNavBackTarget: function () {
					if (this._sFromTargetName) {
						this.doNavToBasedOnTarget(null, this._sFromTargetName);
					} else {
						this.doNavTo("main");
					}
				},

				/**
				 * Check if parameter is a valid phone number
				 * @param  {string} sPhoneNumber User phone number
				 * @return {boolean} true, if it is valid. false, in any other case.
				 */
				isValidPhoneNumber: function (sPhoneNumber) {
					var sPhoneNumberNorm = sPhoneNumber
						.replace("+", "")
						.replace(/\s/g, "");
					return /^[0-9()-]+$/.test(sPhoneNumberNorm);
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

					if(oReject.error && oReject.error.status && oReject.error.status === 412){
						MessageBox.warning(errorMessage,{
							onClose: function(){
								window.location.reload(true);
							}
						});
					}else{
						MessageBox.warning(errorMessage);
					}
				},

				/**
				 * Parse date to oData protocol Date format
				 * @public
				 * @param  {String, Date} oDate Date to be formatted
				 * @return {String} Formatted string date
				 */
				parseDateOdata: function (oDate) {
					if (typeof oDate === "string") {
						if (oDate !== "") {
							oDate = new Date(oDate);
						} else {
							oDate = new Date();
						}
					} else if (oDate === null) {
						oDate = new Date();
					}
					oDate = this.changeDateToGMT(oDate);
					return oDate.getFullYear() + "-" + (parseInt(oDate.getMonth(), 10) + 1 < 10 ? "0" + (parseInt(oDate.getMonth(), 10) + 1) : oDate.getMonth() +
						1) + "-" + (parseInt(oDate.getDate(), 10) < 10 ? "0" + oDate.getDate() : oDate.getDate());
				},

				/**
				 * Parse date to oData protocol DateTime format
				 * @public
				 * @param  {String, Date} oDate Date to be formatted
				 * @return {String} Formatted string datetime
				 */
				parseDateTimeOdata: function (oDate) {
					if (typeof oDate === "string") {
						if (oDate !== "") {
							oDate = new Date(oDate);
						} else {
							oDate = new Date();
						}
					} else if (oDate === null) {
						oDate = new Date();
					}
					oDate = this.changeDateToGMT(oDate);
					return oDate.getFullYear() + "-" + (parseInt(oDate.getMonth(), 10) + 1 < 10 ? "0" + (parseInt(oDate.getMonth(), 10) + 1) : oDate.getMonth() +
							1) + "-" + (parseInt(oDate.getDate(), 10) < 10 ? "0" + oDate.getDate() : oDate.getDate()) + "T" + oDate.getHours() + ":" + oDate.getMinutes() +
						":" + oDate.getSeconds() + ".000Z";
				},

				/**
				 * Parse date to for comments
				 * @public
				 * @param  {String, Date} oDate Date to be formatted
				 * @return {String} Formatted string datetime
				 */
				parseDateTimeComments: function (oDate) {
					if (typeof oDate === "string") {
						if (oDate !== "") {
							oDate = new Date(oDate);
						} else {
							oDate = new Date();
						}
					} else if (oDate === null) {
						oDate = new Date();
					}
					oDate = this.changeDateToGMT(oDate);
					return (parseInt(oDate.getDate(), 10) < 10 ? "0" + oDate.getDate() : oDate.getDate()) + " " + (parseInt(oDate.getMonth(), 10) + 1 <
							10 ? "0" + (parseInt(oDate.getMonth(), 10) + 1) : oDate.getMonth() + 1) + " " + oDate.getFullYear() + " " + oDate.getHours() +
						":" + oDate.getMinutes();
				},

				/**
				 * Parse date to oData protocol Time format
				 * @public
				 * @param  {String, Date} oDate Date to be formatted
				 * @return {String} Formatted string time
				 */
				parseTimeOdata: function (oDate) {
					if (typeof oDate === "string") {
						if (oDate !== "") {
							oDate = new Date(oDate);
						} else {
							oDate = new Date();
						}
					} else if (oDate === null) {
						oDate = new Date();
					}
					oDate = this.changeDateToGMT(oDate);
					return (parseInt(oDate.getHours(), 10) < 10 ? "0" + oDate.getHours() : oDate.getHours()) + ":" + (parseInt(oDate.getMinutes(), 10) <
						10 ? "0" + oDate.getMinutes() : oDate.getMinutes()) + ":" + (parseInt(oDate.getSeconds(), 10) < 10 ? "0" + oDate.getSeconds() :
						oDate.getSeconds());
				},

				/**
				 * Convert Date object from local timezone to GMT
				 * @public
				 * @param  {String, Date} oDate Date to be formatted
				 * @return {String} Formatted date
				 */
				changeDateToGMT: function (dDate) {
					if (dDate instanceof Date) {
						return new Date(
							dDate.getTime() + dDate.getTimezoneOffset() * 60 * 1000
						);
					}
					return null;
				},

				/**
				 * Convert Date object from GMT to local timezone
				 * @public
				 * @param  {String, Date} oDate Date to be formatted
				 * @return {String} Formatted date
				 */
				changeDateFromGMT: function (dDate) {
					if (dDate instanceof Date) {
						return new Date(
							dDate.getTime() - dDate.getTimezoneOffset() * 60 * 1000
						);
					}
					return null;
				},

				jumpTo: function (sId) {
					var sFinalId = this.createId(sId)
					this._oJumpInterval = setInterval(function () {
						if(document.getElementById(sFinalId)){
							var elmnt = document.getElementById(sFinalId);
							elmnt.scrollIntoView();
							clearInterval(this._oJumpInterval);
						}
					}.bind(this), 0.5);
				},

				openMap: function (sType, aCoordinates) {
					var sDomain = this.getResourceBundle().getText("gsaURL");
					var sUrl = sDomain + "gsaweb/gsa.jsp?src=StreetManager";
					if (sType && aCoordinates) {
						if (!Array.isArray(aCoordinates[0])) {
							aCoordinates = [aCoordinates];
						}
						if(sType === "Polygon" && aCoordinates.length === 1){
							aCoordinates = aCoordinates[0];
						}
						sUrl += "&geomType=" + sType + "&coordinates=[";
						aCoordinates.forEach(function (oCoords) {
							sUrl += "[" + oCoords.toString() + "]";
						}.bind(this));
						sUrl += "]";
					}
					if (!this._oMapDialog) {
						this._oMapDialog = sap.ui.xmlfragment("project1.view.Fragment.gsaMapDialog", this);
						this.getView().addDependent(this._oMapDialog);
					}
					this._oMapDialog.open();
					this._oMapFrame = document.createElement('iframe');
					this._oMapFrame.setAttribute("id", "gsaMapFrame");
					this._oMapFrame.setAttribute("width", "99%");
					this._oMapFrame.setAttribute("height", "99%");
					this._oMapFrame.setAttribute("src", sUrl);
					sap.ui.getCore().byId("gsaMapContainer").setContent(this._oMapFrame.outerHTML);

					this._oMapData = null;

					//periodical message sender
					if (this._oInterval) {
						clearInterval(this._oInterval);
					}
					this._oInterval = setInterval(function () {
						var message = 'Hello!  The time is: ' + (new Date().getTime());
						document.getElementById("gsaMapFrame").contentWindow.postMessage(message, sDomain); //send the message and target URI
					}.bind(this), 1);
					//Listen for map close events
					this.addMapListener();
				},

				addMapListener: function () {
					this._mapListener = function (oEvent) {
						var oData = JSON.parse(oEvent.data);
						if (!this._oMapData && oData && oData.properties && oData.properties.USRN) {
							window.removeEventListener("message", this._mapListener, false);
							this._mapListener = null;
							if (this._oInterval) {
								clearInterval(this._oInterval);
							}
							this.onMapDialogClose();
							if (oData.properties.USRN.indexOf("usrn") !== -1) {
								oData.properties.USRN = oData.properties.USRN.split("usrn")[1];
							}
							if(oData.geometry.type === "Polygon"){
								oData.geometry.coordinates = [oData.geometry.coordinates];
							}
							this._oMapData = oData;
							this.onMapClose();
						}
					}.bind(this)
					window.addEventListener('message', this._mapListener, false);
				},

				onMapDialogClose: function () {
					if (this._oInterval) {
						clearInterval(this._oInterval);
					}
					if (this._mapListener) {
						window.removeEventListener("message", this._mapListener, false);
					}
					this._oMapDialog.close();
					this._oMapDialog.destroy();
					this._oMapDialog = null;
				},

				onPrint: function () {
					var sPrintId = "#" + this.getOwnerComponent().sPrintId;
					if ($(sPrintId)[0]) {
						$("body").append("<div id='printDiv'></div>");
						$(sPrintId).clone().appendTo("#printDiv");
						$('#printDiv a').remove();
						$('#printDiv button').remove();
						$("div[data-name='SAP.UKPN.UI.PermitApplication']").hide()
						window.print();
						$("#printDiv").remove()
						$("div[data-name='SAP.UKPN.UI.PermitApplication']").show()
					}
				},
				onPressCompleteJointing: function () {
					if (!this.completeJointingDialog) {
						this.completeJointingDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.JointingComplete", this);
						this.getView().addDependent(this.completeJointingDialog);
					}
					this.completeJointingDialog.open();
					var actualStartDate = this.getView().getModel("PermitJointingModel").getProperty("/actualStartDate");
					var actualEndDate = this.getView().getModel("PermitJointingModel").getProperty("/actualEndDate");
					var proposedEndDate = this.getView().getModel("PermitJointingModel").getProperty("/proposedEndDate");
					var startDate = new Date(actualStartDate);
					var endDate;
					var CurentDate = new Date();
					if (actualEndDate === null) {
						endDate = new Date(proposedEndDate);
					} else {
						endDate = new Date(actualEndDate);
					}

					if (CurentDate >= startDate && CurentDate <= endDate) {
						sap.ui.getCore().byId("idactualJointDate").setMinDate(startDate);
						sap.ui.getCore().byId("idactualJointDate").setMaxDate(CurentDate);
					} else {
						sap.ui.getCore().byId("idactualJointDate").setMinDate(startDate);
						sap.ui.getCore().byId("idactualJointDate").setMaxDate(endDate);
					}

				},
				onPressCancelActualJointing: function () {
					this.completeJointingDialog.close();
					this.completeJointingDialog.destroy();
					this.completeJointingDialog = null;

				},
				onPressConfirmActualJointing: function () {
					var appId = this.getView().getModel("PermitJointingModel").getProperty("/applicationId");
					var dateValue = sap.ui.getCore().byId("idactualJointDate").getDateValue().toISOString().split("Z")[0];
					var oCreatePromise = ApiFacade.getInstance().updateJointingDate(appId, dateValue);
					oCreatePromise.then(function (data) {
							sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("confirmJointingMessage"));
							if (this.getRouter().getHashChanger().getHash().indexOf("PermitHistory") !== -1) {
								this._getInitialData({
									requestId: appId
								});
							} else {
								this.OnSearchPress();
							}
							this.completeJointingDialog.close();
							this.completeJointingDialog.destroy();
							this.completeJointingDialog = null;

						}.bind(this))
						.catch(
							function (oReject) {
								this.standardAjaxErrorDisplay(oReject)
							}.bind(this)
						);

				},

				onPressRevertJointing: function () {
					if (!this.revertJointingDialog) {
						this.revertJointingDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.RevertJointing", this);
						this.getView().addDependent(this.revertJointingDialog);
					}
					this.revertJointingDialog.open();

				},
				onPressCancelRevertJointing: function () {
					this.revertJointingDialog.close();
					this.revertJointingDialog.destroy();
					this.revertJointingDialog = null;

				},
				onPressConfirmRevertJointing: function () {
					var appId = this.getView().getModel("PermitJointingModel").getProperty("/applicationId");
					var oCreatePromise = ApiFacade.getInstance().updateJointingDate(appId, "");
					oCreatePromise.then(function (data) {
							sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("revertJointingMessage"));
							if (this.getRouter().getHashChanger().getHash().indexOf("PermitHistory") !== -1) {
								this._getInitialData({
									requestId: appId
								});
							} else {
								this.OnSearchPress();
							}
							this.revertJointingDialog.close();
							this.revertJointingDialog.destroy();
							this.revertJointingDialog = null;

						}.bind(this))
						.catch(
							function (oReject) {
								this.standardAjaxErrorDisplay(oReject)
							}.bind(this)
						);

				},

				onPressCancelAction: function () {
					if (!this.CancelPermitDialog) {
						this.CancelPermitDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.CancelPermit", this);
						this.getView().addDependent(this.CancelPermitDialog);
					}
					this.CancelPermitDialog.open();
				},

				onPressCancelClose: function () {
					this.getView().getModel("PermitCancelModel").setProperty("/permitCancelComment", "");
					this.CancelPermitDialog.close();
					this.CancelPermitDialog.destroy();
					this.CancelPermitDialog = null;
				},

				onPressCancelConfirm: function () {
					var cancelComment = this.getView().getModel("PermitCancelModel").getProperty("/permitCancelComment");
					var applicationId = this.getView().getModel("PermitCancelModel").getProperty("/applicationId");
					var requestActionPayload = {
						comments: cancelComment
					};
					var valid = this._validateCancelPermit();
					if (valid) {
						var oCreatePromise = ApiFacade.getInstance().createActionpPermit(applicationId, "cancel",
							requestActionPayload);
						oCreatePromise.then(function (data) {
								BusyIndicator.hide();
								if (this.getRouter().getHashChanger().getHash().indexOf("PermitHistory") !== -1) {
									this._getInitialData({
										requestId: applicationId
									});
								} else {
									this.OnSearchPress();
								}
								this.getView().getModel("PermitCancelModel").setProperty("/permitCancelComment", "");
								this.CancelPermitDialog.close();
								this.CancelPermitDialog.destroy();
								this.CancelPermitDialog = null;
							}.bind(this))
							.catch(
								function (oReject) {
									this.standardAjaxErrorDisplay(oReject)
								}.bind(this)
							);
					} else {
						MessageBox.show(this.getView().getModel("i18n").getResourceBundle().getText("please_fill_the_mandatory_field"));
					}
				},

				onChangeCancelComment: function (oEvent) {
					var sCancelComment = oEvent.getSource().getValue().trim();
					if (sCancelComment.length !== 0) {
						sap.ui.getCore().byId("idCancelComment").setValueState("None");
					}
				},

				_validateCancelPermit: function () {
					var valid = true;
					if (this.getView().getModel("PermitCancelModel").getProperty("/permitCancelComment").trim().length === 0) {
						sap.ui.getCore().byId("idCancelComment").setValueState("Error");
						valid = false;
					}
					return valid;
				},

				_getSpecialDesignationData: function () {
					BusyIndicator.show(0);
					ApiFacade.getInstance().getSpecialDesignationStaticData()
						.then(function (data) {
							this.setModel(new JSONModel(data), "spDesigDataModel");
							BusyIndicator.hide();
						}.bind(this))
						.catch(function (oReject) {
							BusyIndicator.hide();
							this.standardAjaxErrorDisplay(oReject)
						}.bind(this));
				},

				_getCalculatedDays: function (oFrom, oTo) {
					BusyIndicator.show(0);
					ApiFacade.getInstance().getCalculatedDays(moment(oFrom).format('YYYY-MM-DD'), moment(oTo).format('YYYY-MM-DD'))
						.then(function (data) {
							this.getModel("oModel").setProperty("/workingDays", data.workingDays);
							this.getModel("oModel").setProperty("/calendarDays", data.calendarDays);
							BusyIndicator.hide();
						}.bind(this))
						.catch(function (oReject) {
							BusyIndicator.hide();
							this.standardAjaxErrorDisplay(oReject)
						}.bind(this));
				},

				onPressExtendPermit: function (bview) {
					this.extendPermit = bview;
					if (!this.extendPermitDialog) {
						this.extendPermitDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.ExtendPermit", this);
						this.getView().addDependent(this.extendPermitDialog);
					}
					this.extendPermitDialog.open();

				},
				onPressCancelExtend: function () {
					this.getView().getModel("ExtendPermitModel").setProperty("/extendPermitComment", "");
					sap.ui.getCore().byId("idExtendPermitDate").setValue("");
					this.extendPermitDialog.close();
					this.extendPermitDialog.destroy();
					this.extendPermitDialog = null;

				},
				onPressConfirmExtend: function () {
					var oData;
					if (this.extendPermit === "search") {
						BusyIndicator.show(0);
						var oCreateData = ApiFacade.getInstance().getApplicationdetails(this.getView().getModel("ExtendPermitModel").getData().data.applicationId);
						oCreateData.then(function (data) {
								BusyIndicator.hide();
								oData = data;
								this.onExtend(oData);
							}.bind(this))
							.catch(
								function (oReject) {
									BusyIndicator.hide();
									this.standardAjaxErrorDisplay(oReject)
								}.bind(this)
							);
					} else {
						oData = JSON.parse(JSON.stringify(this.getView().getModel("ExtendPermitModel").getProperty("/data")));
						this.onExtend(oData);
					}
				},

				onExtend: function (oData) {
					var dateValue = sap.ui.getCore().byId("idExtendPermitDate").getDateValue();
					var comment = this.getView().getModel("ExtendPermitModel").getProperty("/extendPermitComment");
					oData.proposedEndDate = dateValue;
					oData.alterationReason = comment;
					var valid = this._validateExtendPermit();
					if (valid) {
						BusyIndicator.show(0);
						var oCreatePromise = ApiFacade.getInstance().createAlterPermit(oData.applicationId, oData);
						oCreatePromise.then(function (data) {
								BusyIndicator.hide();
								this._submitPermit(oData.applicationId, data.applicationId, data.alterationId);
							}.bind(this))
							.catch(
								function (oReject) {
									BusyIndicator.hide();
									this._refreshData(oData.applicationId);
									this.standardAjaxErrorDisplay(oReject)
								}.bind(this)
							);
					} else {
						MessageBox.show(this.getView().getModel("i18n").getResourceBundle().getText("please_fill_the_mandatory_field"));
					}
				},

				onChangeComment: function (oEvent) {
					if (oEvent.getParameter("value").length >= 1) {
						sap.ui.getCore().byId("idExtendPermitComment").setValueState("None");
					}
				},
				onChangeDate: function (oEvent) {
					if (oEvent.getParameter("value").length >= 1) {
						sap.ui.getCore().byId("idExtendPermitDate").setValueState("None");
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

				_validateExtendPermit: function () {
					var valid = true;
					if (!sap.ui.getCore().byId("idExtendPermitDate").isValidValue() || !sap.ui.getCore().byId("idExtendPermitDate").getDateValue()) {
						sap.ui.getCore().byId("idExtendPermitDate").setValueState("Error");
						valid = false;
					}
					if (this.getView().getModel("ExtendPermitModel").getProperty("/extendPermitComment").trim().length === 0) {
						sap.ui.getCore().byId("idExtendPermitComment").setValueState("Error");
						valid = false;
					}
					return valid;
				},
					
				_submitPermit: function (appId, alterationId, draftId) {
					BusyIndicator.show(0);
					ApiFacade.getInstance().submitAlterPermit(appId, alterationId)
					.then(function (oData) {
						sap.m.MessageToast.show(this.getResourceBundle().getText("permitExtended"));
						this._refreshData(appId);
					}.bind(this))
					.catch(function (oReject) {
						this.standardAjaxErrorDisplay(oReject);
						ApiFacade.getInstance().discardAlterationDraft(appId, draftId)
						.then(function (data) {
							this._refreshData(appId);
						}.bind(this))
						.catch(function (oReject) {
							BusyIndicator.hide();
							this.standardAjaxErrorDisplay(oReject)
						}.bind(this));
					}.bind(this));
				},
				_refreshData: function (appId) {
					BusyIndicator.hide(0);
					if (this.getRouter().getHashChanger().getHash().indexOf("PermitHistory") !== -1) {
						this._getInitialData({
							requestId: appId
						});
					} else {
						this.OnSearchPress();
					}
					this.getView().getModel("ExtendPermitModel").setProperty("/extendPermitComment", "");
					sap.ui.getCore().byId("idExtendPermitDate").setValue("");
					this.extendPermitDialog.close();
					this.extendPermitDialog.destroy();
					this.extendPermitDialog = null;
				},

				//Revert Action (Start or Sop)				
				onPressRevertAction: function (RevertPermit) {
					this.RevertPermit = RevertPermit;
					if (!this.RevertPermitDialog) {
						this.RevertPermitDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.RevertPermit", this);
						this.getView().addDependent(this.RevertPermitDialog);
					}
					if (this.RevertPermit === "RevertStart") {
						sap.ui.getCore().byId("idDialogRevertPermit").setTitle(this.getView().getModel("i18n").getResourceBundle().getText(
							"revert_permit_start"));
					} else {
						sap.ui.getCore().byId("idDialogRevertPermit").setTitle(this.getView().getModel("i18n").getResourceBundle().getText(
							"revert_permit_stop"));
					}
					this.RevertPermitDialog.open();
				},
				onPressRevertCancel: function () {
					this.getView().getModel("PermitRevertModel").setProperty("/permitRevertReason", "");
					this.RevertPermitDialog.close();
					this.RevertPermitDialog.destroy();
					this.RevertPermitDialog = null;
				},
				onPressRevertConfirm: function () {
					var revertReason = this.getView().getModel("PermitRevertModel").getProperty("/permitRevertReason");
					var applicationId = this.getView().getModel("PermitRevertModel").getProperty("/applicationId");
					var requestActionPayload = {
						comments: revertReason
					};
					var valid = this._validateRevertPermit();
					if (valid) {
						if (this.RevertPermit === "RevertStart") {
							var oCreatePromise = ApiFacade.getInstance().createActionpPermit(applicationId, "revert-start",
								requestActionPayload);
						} else {
							oCreatePromise = ApiFacade.getInstance().createActionpPermit(applicationId, "revert-stop",
								requestActionPayload);
						}
						BusyIndicator.show(0);
						oCreatePromise.then(function (data) {
							this.RevertPermitDialog.close();
							this.RevertPermitDialog.destroy();
							this.RevertPermitDialog = null;
								BusyIndicator.hide();
								this._refreshRevertStartStop(applicationId);
							}.bind(this))
							.catch(
								function (oReject) {
									this._refreshRevertStartStop(applicationId);
									this.standardAjaxErrorDisplay(oReject)
								}.bind(this)
							);
					} else {
						MessageBox.show(this.getView().getModel("i18n").getResourceBundle().getText("please_fill_the_mandatory_field"));
					}
				},

				onPressDiscard: function () {
					MessageBox.warning(this.getResourceBundle().getText("discardConfirm"), {
						actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
						emphasizedAction: MessageBox.Action.OK,
						onClose: function (sAction) {
							if (sAction === "OK") {
								this._discardDraft();
							}
						}.bind(this)
					});
				},

				_validateRevertPermit: function () {
					var valid = true;
					if (this.getView().getModel("PermitRevertModel").getProperty("/permitRevertReason").trim().length === 0) {
						sap.ui.getCore().byId("idRevertReason").setValueState("Error");
						valid = false;
					}
					return valid;
				},

				_discardDraft: function () {
					BusyIndicator.show(0);
					var oPromise;
					if (this.alterationId) {
						oPromise = ApiFacade.getInstance().discardAlterationDraft(this.AlterapplicationID, this.draftAlterationId);
					} else {
						oPromise = ApiFacade.getInstance().discardApplicationDraft(this.getView().getModel("oModel").getData().isApplicationId.applicationId);
					}
					oPromise.then(function (data) {
							BusyIndicator.hide();
							MessageBox.success(this.getResourceBundle().getText("discardSuccess"), {
								onClose: function () {
									this.onNavBack();
								}.bind(this)
							});
						}.bind(this))
						.catch(function (oReject) {
							BusyIndicator.hide();
							this.standardAjaxErrorDisplay(oReject)
						}.bind(this));
				},

				_refreshRevertStartStop: function (appId) {
					if (this.getRouter().getHashChanger().getHash().indexOf("PermitHistory") !== -1) {
						this._getInitialData({
							requestId: appId
						});
					} else {
						this.OnSearchPress();
					}
					this.getView().getModel("PermitRevertModel").setProperty("/permitRevertReason", "");
					this.RevertPermitDialog.close();
					this.RevertPermitDialog.destroy();
					this.RevertPermitDialog = null;
				},

				addDateDuration: function(oDate, sDuration){
					var oDuration = moment.duration(sDuration)._data
					oDate.setYear(oDate.getUTCFullYear() + oDuration.years);
					oDate.setMonth(oDate.getMonth() + oDuration.months);
					oDate.setDate(oDate.getDate() + oDuration.days);
					oDate.setHours(oDate.getHours() + oDuration.hours);
					oDate.setMinutes(oDate.getMinutes() + oDuration.minutes);
					oDate.setSeconds(oDate.getSeconds() + oDuration.seconds);
					oDate.setTime(oDate.getTime() + oDuration.milliseconds);
					return oDate;
				},

				/**
				 * Export the content to the table to Excel
				 * @param  {string} sIDTable The ID of the table to downlad to Excel
				 * @param  {string} sNameFile The name of the file
				 * @return {undefined}       Nothing to return
				 */
				exportTableToExcel: function(sIDTable, sNameFile) {
					var oTable = this.getView().byId(sIDTable);
					if (!oTable) {
					return;
					}

					BusyIndicator.show(0);
					var sModelName = oTable.getBindingInfo("items").model;
					var data = [];
					var headerData = [];
					var aVisibleHeaders = {};
					for(var i in oTable.getColumns()){
						var oHeader = oTable.getColumns()[i];
						if(oHeader.getVisible()){
							var sValue;
							var oInternalHeader = oHeader.getHeader();
							if (!oInternalHeader.mAggregations.items && !oInternalHeader.mAggregations.content
							&& oHeader.getHeader().getText()) {
								sValue = oHeader.getHeader().getText();
							} else if (oInternalHeader.getMetadata().getName() === "sap.m.VBox") {
								sValue = oInternalHeader.getAggregation("items")[0].getText();
							} else if(oInternalHeader.mAggregations.content){
								sValue = oInternalHeader.getAggregation("content")[0].getText();
							} else if(oInternalHeader.mAggregations.items) {
								sValue = oHeader
								.getHeader()
								.getItems()[0]
								.getItems()[0]
								.getText();
							}
							if(sValue !== this.getResourceBundle().getText("markRead")){
								headerData.push(sValue);
								aVisibleHeaders[i.toString()] = true;
							}
						}
					}

					data.push(headerData);

					oTable.getItems().forEach(function(oTableRow) {
						var rowData = [];
						for(var i in oTableRow.getCells()){
							if(aVisibleHeaders[i.toString()]){
								var oTableCell = oTableRow.getCells()[i];
								if (oTableCell.getSelectedKey) {
								var sKey = oTableCell.getSelectedKey();
								oTableCell.getItems().forEach(function(oItem) {
									if (oItem.getKey() === sKey) {
										rowData.push(oItem.getText());
									}
								});
								} else if(oTableCell.getItems){
									var aItems = oTableCell.getItems();
									aItems.forEach(function(oItem){
										if(oItem.getVisible()){
											rowData.push(oItem.getText());
										}
									}.bind(this));
								} else if(oTableCell.getValue || 
								(oTableCell.getText && oTableCell.getText() !== this.getResourceBundle().getText("markRead"))){
								rowData.push(
									oTableCell.getText && oTableCell.getText() ||
									oTableCell.getValue && oTableCell.getValue()
								);
								}
							}
						};
						data.push(rowData);
					}.bind(this));

					var wb = XLSX.utils.book_new(),
					ws = XLSX.utils.aoa_to_sheet(data);

					/* add worksheet to workbook */
					XLSX.utils.book_append_sheet(wb, ws);

					XLSX.writeFile(wb, sNameFile);

					BusyIndicator.hide();
				}

			});
	});
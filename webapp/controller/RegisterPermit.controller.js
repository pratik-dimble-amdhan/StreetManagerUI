sap.ui.define([
		"project1/controller/base/BaseController",
		"jquery.sap.global",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessagePopover",
		"sap/m/MessagePopoverItem",
		"sap/m/MessageBox",
		"project1/services/apiFacade",
		"sap/ui/core/BusyIndicator",
		"project1/util/Formatter"
	], function (BaseController, jQuery, JSONModel, MessagePopover, MessagePopoverItem, MessageBox, ApiFacade, BusyIndicator, Formatter) {
		"use strict";

		return BaseController.extend("project1.controller.RegisterPermit", {
			aOldSiteAttachments: [],
			formatter: Formatter,
			onInit: function () {
				this.oRouter = this.getOwnerComponent().getRouter();
				this.oRouter.getRoute("RegisterPermit").attachPatternMatched(this.onRoutemacth, this);
			},

			onRoutemacth: function (oEvent) {
				var id = oEvent.getParameter("arguments").state;
				var aPromises = [];
				aPromises.push(this.getRegistrationTypes());
				aPromises.push(this.getPosition());
				Promise.all(aPromises).then(function(){
					this.clearData();
					if (id !== "id") {
						// var isRegisterPermitId = this.getOwnerComponent().getModel("RegModel").setProperty("/isRegisterPermitId", parseInt(id));
						this.getOwnerComponent().getModel("RegModel").setProperty("/isRegisterPermitId", parseInt(id));
						this.getPermitReference();
						this.getInspectionunits(id);
						this.getSites(id);
						if (this.getView().getModel("RegModel").getData().appData.actualEndDate !== null) {
							this.getView().byId("idReinstatementDatePicker").setDateValue(new Date(this.getView().getModel("RegModel").getData().appData.actualEndDate));
						}
					}
					this.getView().getModel("RegModel").setProperty("/editClick", false);
				}.bind(this));
			},

			getRegistrationTypes: function(){
				BusyIndicator.show();
				var oPromise = ApiFacade.getInstance().getStaticData("REINSTATEMENT_STATUS");
				oPromise.then(function (data) {
					this.setModel(new JSONModel(data), "registerTypes");
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject)
						BusyIndicator.hide();
					}.bind(this)
				);
				return oPromise;
			},

			getPosition: function () {
				BusyIndicator.show();
				var oPromise = ApiFacade.getInstance().getStaticData("locations");
				oPromise.then(function (data) {
					BusyIndicator.hide();
					this.setModel(new JSONModel(data), "positions");
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject)
						BusyIndicator.hide();
					}.bind(this)
				);
				return oPromise;
			},

			getInspectionunits: function (appId) {
				$.ajax({
					type: "GET",
					url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/applications/" + appId + "/inspection-units",
					contentType: "application/json",
					async: false,
					success: function (data) {
						this.getView().getModel("RegModel").setProperty("/totalUnits", data.inspectionUnits);
					}.bind(this),
					error: function (error) {
						var err = JSON.parse(error.responseText);
						MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
					}
				});
			},

			getCalculateInspectionunits: function (appId) {
				$.ajax({
					type: "GET",
					url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/applications/" + appId + "/calculate-inspection-units",
					contentType: "application/json",
					success: function (data) {
						this.getView().getModel("RegModel").setProperty("/totalSites", data.totalSites);
						this.getView().getModel("RegModel").setProperty("/totalUnits", data.totalUnits);
					}.bind(this),
					error: function (error) {
						var err = JSON.parse(error.responseText);
						MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
					}
				});
			},

			getPermitReference: function () {
				var token = null;
				var isRegisterPermitId = this.getOwnerComponent().getModel("RegModel").getProperty("/isRegisterPermitId");
				$.ajax({
					type: "GET",
					url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/applications/" + isRegisterPermitId,
					contentType: "application/json",
					async: false,
					success: function (data) {
						this.getView().getModel("RegModel").setProperty("/workno", data.workOrderNumber);
						this.getView().getModel("RegModel").setProperty("/workoperationno", data.workOrderOperationNumber);
						this.getView().getModel("RegModel").setProperty("/PermitNo", data.permitReferenceNumber);
						this.getView().getModel("RegModel").setProperty("/appData", data);
						this.getView().getModel("RegModel").setProperty("/workReferenceNumber", data.workReferenceNumber);
					}.bind(this),
					error: function (error) {
						var err = JSON.parse(error.responseText);
						MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
					},
					beforeSend: function (xhr) {
						xhr.setRequestHeader("X-CSRF-Token", "Fetch");
					},
					complete: function (xhr) {
						token = xhr.getResponseHeader("X-CSRF-Token");
						this.getOwnerComponent().getModel("RegModel").setProperty("/CSRFToken", token);
						this.getOwnerComponent().CSRFToken = token;
					}.bind(this)
				});
			},

			getSites: function (id) {
				$.ajax({
					type: "GET",
					url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/applications/" + id + "/sites",
					contentType: "application/json",
					async: false,
					success: function (data) {
						data.forEach(function (oSite) {
							if (oSite.reinstatementCoordinates && this.IsJsonString(oSite.reinstatementCoordinates)) {
								oSite.reinstatementCoordinates = JSON.parse(oSite.reinstatementCoordinates);
							}
						}.bind(this));
						this.getView().getModel("RegModel").setProperty("/Sites", data);
						this.getView().getModel("RegModel").setProperty("/totalSites", data.length);
						this.getSiteFiles(data, id);
					}.bind(this),
					error: function (error) {
						var err = JSON.parse(error.responseText);
						MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
					}
				});
			},

			getSiteFiles: function (aSites, sId) {
				var aPromises = [];
				aSites.forEach(function (oSite) {
					var oPromise = ApiFacade.getInstance().getSiteFile(
						sId,
						oSite
					);
					oPromise.then(function (oData) {
						if (oData.files.length > 0) {
							this.aOldSiteAttachments[oData.sSiteNo] = oData.files;
						}
					}.bind(this));
					aPromises.push(oPromise);
				}.bind(this));

				Promise.all(aPromises)
					.then(
						function (aResolve) {
							BusyIndicator.hide();
						}.bind(this)
					)
					.catch(
						function (oReject) {
							//Hide busy application
							BusyIndicator.hide();
							this.standardAjaxErrorDisplay(oReject)
						}.bind(this)
					);

			},

			onHome: function () {
				MessageBox.confirm(
					"Do you want to cancel the application? If cancelled all unsaved data lost.", {
						actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
						onClose: function (oAction) {
							if (oAction === MessageBox.Action.OK) {
								this.clearData();
								this.oRouter.navTo("RouteHome");
							}
						}.bind(this)
					});
			},
			onCancel: function () {
				MessageBox.confirm(
					this.getResourceBundle().getText("cancelApplicationMsg"), {
						actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
						onClose: function (oAction) {
							if (oAction === MessageBox.Action.OK) {
								this.clearData();
								this.onNavBack();
							}
						}.bind(this)
					});

			},

			clearData: function () {
				this.addSiteModel();
				this.aOldSiteAttachments = [];
				this.setModel(new JSONModel([]), "AttachmentsModel");
				this.getOwnerComponent().setRegistrationModel();
				this.getView().byId("idRegisternavCon").to(this.byId("idRegisterp1"));
				this.getView().byId("idRegStep1").addStyleClass("clickBorder");
				this.getView().byId("idRegStep2").removeStyleClass("clickBorder");
				this.getView().byId("idAddSiteForm").setVisible(false);
				this.getView().byId("idSubmitRegistration").setVisible(false);
				this.getView().byId("idViewSummary").setVisible(true);
				this.getView().byId("idRegSave").setVisible(true);
				this.getView().byId("idAddnewsiteBtn").setVisible(true);
				this.getView().byId("idAddnewsiteBtn").setText("Add new site");
				this.getView().byId("idAddSiteSaveCopyBtn").setEnabled(false);
				this.getView().byId("idAddSiteSaveBtn").setEnabled(false);
				this.getView().byId("idReinstatementDateMessage").setVisible(false);
				this.getView().byId("idReinstatementDatePicker").setValueState("None");
				this.getView().byId("idAddSitePosition").setValueState("None");
				this.getView().byId("idAddSiteRegtype").setValueState("None");
				this.getView().byId("idSiteLocation").setValueState("None");
				this.getView().byId("idLength").setValueState("None");
				this.getView().byId("idWidth").setValueState("None");
				this.getView().byId("idDepth").setValueState("None");
				this.getView().byId("idDepthMessage").setVisible(false);
				this.getView().byId("idSegBtnFinalReInstmt").setSelectedItem("none");
				this.getView().byId("idSegBtnFinalReInstmt").setSelectedKey("");
				this.getView().byId("messagePopoverBtn").setVisible(true);
			},

			addSiteModel: function () {
				var data = {
					Sitecoordinates: "",
					Reinstatementdate: "",
					Reinstatementdatevalue: "",
					locationDescription: "", //SiteLocation
					Reinstatementevidence: "",
					Registrationcomments: "",
					Finalreinstatement: "",
					length: "",
					depth: "",
					width: "",
					selectedPosition: "",
					selectedRegistrationtype: ""
				};
				var model = new JSONModel(data);
				this.getView().setModel(model, "SiteModel");
			},

			handleChangeReinstatementDate: function (evt) {
				if (evt.getSource().getDateValue() !== null) {
					evt.getSource().setValueState("None");
					this.getView().getModel("SiteModel").setProperty("/Reinstatementdate", evt.getSource().getDateValue());
					var actStartdate = this.getView().getModel("RegModel").getData().appData.actualStartDate;
					var actEnddate = this.getView().getModel("RegModel").getData().appData.actualEndDate;
					var StartDate = null,
						EndDate = null;
					if (actStartdate !== null && actEnddate !== null) {
						StartDate = this.createDate(new Date(actStartdate));
						EndDate = this.createDate(new Date(actEnddate));
						var selDate = this.createDate(evt.getSource().getDateValue());
						if (StartDate <= selDate && EndDate >= selDate) {
							this.getView().byId("idReinstatementDateMessage").setVisible(false);
						} else {
							this.getView().byId("idReinstatementDateMessage").setVisible(true);
							this.getView().byId("idReinstatementDateMessage").setText(this.getResourceBundle().getText("ReinstatementdateErrorMessage") +
								this.formatter.DateFormatMomentwithoutTime(actStartdate) + " - " + this.formatter.DateFormatMomentwithoutTime(actEnddate));
						}
					}
				} else {
					evt.getSource().setValueState("Error");
					this.getView().getModel("SiteModel").setProperty("/Reinstatementdate", "");
				}
				this.validAddsiteform();
			},

			createDate: function (date) {
				var datval = date.getDate(),
					month = date.getMonth(),
					year = date.getFullYear();
				return new Date(year, month, datval);
			},

			checkRegex: function (val, ctrl) {
				var Reg = new RegExp('^\\d*\\.?\\d\\d?$');
				return Reg.test(val);
			},

			handleChangeLength: function (evt) {
				var val = Number(evt.getSource().getValue());
				if (this.checkRegex(val)) {
					evt.getSource().setValueState("None");
				} else {
					evt.getSource().setValueState("Error");
					evt.getSource().setValueStateText("only 2 digits after decimal");
					this.validAddsiteform();
					return;
				}
				if (evt.getSource().getValue().length !== 0 && Number(evt.getSource().getValue()) >= 10000) {
					evt.getSource().setValueState("Error");
					evt.getSource().setValueStateText("Length max allowed is 9999.99");
				} else {
					evt.getSource().setValueState("None");
				}
				this.validAddsiteform();
			},

			handleChangeWidth: function (evt) {
				var val = Number(evt.getSource().getValue());
				if (this.checkRegex(val)) {
					evt.getSource().setValueState("None");
				} else {
					evt.getSource().setValueState("Error");
					evt.getSource().setValueStateText("only 2 digits after decimal");
					this.validAddsiteform();
					return;
				}

				if (evt.getSource().getValue().length !== 0 && Number(evt.getSource().getValue()) >= 100) {
					evt.getSource().setValueState("Error");
					evt.getSource().setValueStateText("Length max allowed is 99.99");
				} else {
					evt.getSource().setValueState("None");
				}
				this.validAddsiteform();
			},

			handleChangeDepth: function (evt) {
				var val = Number(evt.getSource().getValue());
				if (this.checkRegex(val)) {
					evt.getSource().setValueState("None");
				} else {
					if (val > 10) {
						this.getView().byId("idDepthMessage").setVisible(true);
					} else {
						this.getView().byId("idDepthMessage").setVisible(false);
					}
					evt.getSource().setValueState("Error");
					evt.getSource().setValueStateText("only 2 digits after decimal");
					this.validAddsiteform();
					return;
				}
				if (evt.getSource().getValue().length !== 0 && Number(evt.getSource().getValue()) > 10) {
					evt.getSource().setValueState("Error");
					evt.getSource().setValueStateText("Length max allowed is 10");
					this.getView().byId("idDepthMessage").setVisible(true);
				} else {
					evt.getSource().setValueState("None");
					this.getView().byId("idDepthMessage").setVisible(false);
				}
				this.validAddsiteform();
			},

			handleChangeSitelocation: function (evt) {
				if (evt.getSource().getValue().length !== 0) {
					evt.getSource().setValueState("None");
				} else {
					evt.getSource().setValueState("Error");
				}
				this.validAddsiteform();
			},

			handleChangeRegComments: function () {
				// this.validAddsiteform();
			},

			onAddnewsite: function () {
				this.addSiteModel();
				this.createSitenumber();
				this.getPosition();
				this.clearSiteForm();
				if (this.getView().getModel("RegModel").getData().appData.actualEndDate !== null) {
					this.getView().byId("idReinstatementDatePicker").setDateValue(new Date(this.getView().getModel("RegModel").getData().appData.actualEndDate));
					this.getView().byId("idReinstatementDatePicker").setMaxDate(new Date(this.getView().getModel("RegModel").getData().appData.actualEndDate));
					var oMinDate = new Date(this.getView().getModel("RegModel").getData().appData.actualStartDate);
					oMinDate.setSeconds(oMinDate.getSeconds() + 1);
					this.getView().byId("idReinstatementDatePicker").setMinDate(oMinDate);
				}
			},

			clearSiteForm: function () {
				this.getView().byId("idAddSiteForm").setVisible(true);
				this.getView().byId("idAddnewsiteBtn").setVisible(false);
				this.getView().byId("idAddSiteSaveCopyBtn").setEnabled(false);
				this.getView().byId("idAddSiteSaveBtn").setEnabled(false);
				this.getView().byId("idReinstatementDateMessage").setVisible(false);
				this.getView().byId("idSegBtnFinalReInstmt").setSelectedItem("none");
				this.getView().byId("idAddSitePosition").setSelectedKey("");
				this.getView().byId("idAddSiteRegtype").setSelectedKey("");
				this.getView().byId("idSegBtnFinalReInstmt").setSelectedKey("");
				this.getView().byId("idReinstatementDatePicker").setValueState("None");
				this.getView().byId("idAddSitePosition").setValueState("None");
				this.getView().byId("idAddSiteRegtype").setValueState("None");
				this.getView().byId("idSiteLocation").setValueState("None");
				this.getView().byId("idLength").setValueState("None");
				this.getView().byId("idWidth").setValueState("None");
				this.getView().byId("idDepth").setValueState("None");
				this.getView().byId("idDepth").setValueState("None");
				this.getView().byId("idDepthMessage").setVisible(false);
				this.jumpTo("idAddSiteForm");
			},

			createSitenumber: function () {
				var oSites = this.getView().getModel("RegModel").getData().Sites;
				if (oSites.length !== 0) {
					var oVal = Math.max.apply(Math, oSites.map(function (o) {
						return o.uiSiteNumber;
					}));
					this.getsiteNo(oVal + 1);
				} else {
					this.getView().getModel("RegModel").setProperty("/AddSiteNo", "001");
				}
				this.replaceSiteAttachments();
			},

			replaceSiteAttachments: function () {
				var sSiteNo = this.getView().getModel("RegModel").getProperty("/AddSiteNo");
				if (!this.aOldSiteAttachments[sSiteNo]) {
					this.aOldSiteAttachments[sSiteNo] = [];
				}
				var aItems = this.aOldSiteAttachments[sSiteNo];
				var aFiles = this.byId("uploadCollection").getItems();
				aFiles.forEach(function (oFile) {
					oFile.destroy();
				});
				this.byId("uploadCollection").destroyItems();
				this.setModel(new JSONModel({
					attachments: this.aOldSiteAttachments[sSiteNo]
				}), "AttachmentsModel");
				/*if(aItems.length > 0){
					var aNewFiles = this.byId("uploadCollection").getItems();
					aNewFiles.forEach(function(){
						
					});
				}*/
			},

			getsiteNo: function (oVal) {
				if (oVal < 10) {
					this.getView().getModel("RegModel").setProperty("/AddSiteNo", "00" + oVal);
				} else if (oVal >= 10 && oVal <= 99) {
					this.getView().getModel("RegModel").setProperty("/AddSiteNo", "0" + oVal);
				} else {
					this.getView().getModel("RegModel").setProperty("/AddSiteNo", oVal);
				}
			},

			onSelectPosition: function (evt) {
				if (evt.getSource().getValue().length !== 0) {
					this.getView().getModel("SiteModel").setProperty("/selectedPosition", evt.getSource().getValue());
					evt.getSource().setValueState("None");
				} else {
					evt.getSource().setValueState("Error");
				}
				this.validAddsiteform();
			},

			onSelectRegistrationtype: function (evt) {
				if (evt.getSource().getValue().length !== 0) {
					this.getView().getModel("SiteModel").setProperty("/selectedRegistrationtype", evt.getSource().getValue());
					evt.getSource().setValueState("None");
				} else {
					this.getView().getModel("SiteModel").setProperty("/selectedRegistrationtype", "");
					evt.getSource().setValueState("Error");
				}
				this.validAddsiteform();
			},

			onSelectFinalReInstmt: function (evt) {
				this.validAddsiteform();
			},

			onCancelSite: function () {
				MessageBox.confirm(
					"Do you want to cancel site? If Ok all unsaved data lost.", {
						actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
						onClose: function (oAction) {
							if (oAction === MessageBox.Action.OK) {
								if (this.getView().byId("idSitesTable").getSelectedItem() !== null) {
									this.getView().getModel("RegModel").setProperty("/tableButtons", true);
									var selectedRow = this.getView().byId("idSitesTable").getSelectedItem().getBindingContextPath();
									var Seldata = this.getOwnerComponent().getModel("RegModel").getProperty(selectedRow);
									if (Seldata.version && Seldata.version.toUpperCase() !== "DRAFT") {
										this.getView().getModel("RegModel").setProperty("/deleteButton", false);
									} else {
										this.getView().getModel("RegModel").setProperty("/deleteButton", true);
									}
								} else {
									this.getView().getModel("RegModel").setProperty("/tableButtons", false);
									this.getView().getModel("RegModel").setProperty("/deleteButton", false);
								}
								this.getView().byId("idAddSiteForm").setVisible(false);
								this.getView().byId("idAddnewsiteBtn").setVisible(true);
							}
						}.bind(this)
					}
				);
			},

			onSaveSite: function () {
				this.onSaveSiteData(true);
			},

			onSaveCopySite: function () {
				this.onSaveSiteData(false);
			},

			onSaveSiteData: function (savesite) {
				var Reinsdate = this.getView().byId("idReinstatementDatePicker").getDateValue();
				var selectedPosition = this.getView().byId("idAddSitePosition").getSelectedItem().getKey();
				var selectedRegistrationtype = this.getView().byId("idAddSiteRegtype").getSelectedItem().getKey();
				var SiteLocation = this.getView().byId("idSiteLocation").getValue();
				var Meslength = this.getView().byId("idLength").getValue();
				var MesWidth = this.getView().byId("idWidth").getValue();
				var MesDepth = this.getView().byId("idDepth").getValue();
				var Registrationcomments = this.getView().byId("idRegComments").getValue();
				var FinalReinstatement = this.getView().byId("idSegBtnFinalReInstmt").getSelectedKey();
				var oData = {
					constructionMethod: "",
					depth: Number(MesDepth),
					eastings: this.getModel("SiteModel").getProperty("/Eastings"),
					finalReinstatement: FinalReinstatement === "Yes" ? true : false,
					inspectionUnits: 1,
					length: Number(Meslength),
					locationDescription: SiteLocation,
					locationTypes: selectedPosition,
					northings: this.getModel("SiteModel").getProperty("/Northings"),
					numberOfHoles: 0,
					registrationComments: Registrationcomments,
					reinstatementDate: Reinsdate,
					reinstatementStatus: selectedRegistrationtype,
					reinstatementType: "excavation",
					uiSiteNumber: this.getView().getModel("RegModel").getProperty("/AddSiteNo"),
					width: Number(MesWidth),
					geometry: this.getModel("SiteModel").getProperty("/geometry") ? this.getModel("SiteModel").getProperty("/geometry") : {
						type: "Point",
						coordinates: [this.getModel("SiteModel").getProperty("/Eastings"), this.getModel("SiteModel").getProperty("/Northings")]
					}
				};

				var siteId = this.getOwnerComponent().getModel("RegModel").getProperty(this.selectedRow + "/id");
				var appId = this.getView().getModel("RegModel").getProperty("/isRegisterPermitId");
				if (this.getView().getModel("RegModel").getProperty("/editClick")) {
					this.updateSite(appId, oData, savesite, siteId);

				} else {
					this.createSite(appId, oData, savesite);
				}
				this.getView().getModel("RegModel").setProperty("/editClick", false);
			},

			createSite: function (appId, oData, savesite) {
				BusyIndicator.show(0);
				var CSRFToken = this.getOwnerComponent().getModel("RegModel").getProperty("/CSRFToken");

				$.ajax({
					type: "POST",
					url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/applications/" + appId + "/sites",
					contentType: "application/json",
					async: false,
					data: JSON.stringify(oData),
					headers: {
						"x-csrf-token": CSRFToken
					},
					success: function (data) {
						oData.siteId = data.siteId;
						this.updateSiteAttachments(oData, savesite);
					}.bind(this),
					error: function (error) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(error)
					}.bind(this)
				});
			},

			updateSite: function (appId, oData, savesite, siteId) {
				BusyIndicator.show(0);
				var oCreatePromise = ApiFacade.getInstance().updateSiteData(appId, oData, siteId);
				oCreatePromise.then(function (data) {
						oData.siteId = data.siteId;
						this.updateSiteAttachments(oData, savesite);
					}.bind(this))
					.catch(
						function (oReject) {
							this.standardAjaxErrorDisplay(oReject)
							BusyIndicator.hide();
						}.bind(this)
					);
			},

			updateSiteAttachments: function (oSiteData, savesite) {
				var sSiteId = oSiteData.siteId;
				var sSiteNo = this.getView().getModel("RegModel").getProperty("/AddSiteNo");
				var appId = this.getView().getModel("RegModel").getProperty("/isRegisterPermitId");
				var aItems = this.byId("uploadCollection").getItems();
				var aFormFiles = [];
				var aFinalFiles = [];
				// Deletion
				if (this.aOldSiteAttachments[sSiteNo]) {
					aFormFiles = this.aOldSiteAttachments[sSiteNo].reduce(function (acc, value) {
						var bDelete = true;
						aItems.forEach(function (oItem) {
							if (
								oItem.mProperties.ariaLabelForPicture &&
								oItem.mProperties.ariaLabelForPicture === value.mProperties.ariaLabelForPicture
							) {
								bDelete = false;
							}
						});

						if (bDelete) {
							acc.push({
								id: value.mProperties.ariaLabelForPicture,
								mode: "deletion"
							});
						} else {
							aFinalFiles.push(value);
						}
						return acc;
					}, aFormFiles);
				}

				// Creation
				aFormFiles = aItems.reduce(
					function (acc, oItem) {
						if (!oItem.mProperties.ariaLabelForPicture) {
							acc.push(oItem);
						}
						return acc;
					}.bind(this),
					aFormFiles
				);

				if (aFormFiles.length > 0) {
					var aPromises = aFormFiles.map(
						function (oFormFile) {
							if (oFormFile.mode && oFormFile.mode === "deletion") {
								return ApiFacade.getInstance().deleteSiteFile(
									oFormFile.id,
									appId,
									sSiteId
								);
							}
							var oCreatePromise = ApiFacade.getInstance().createSiteFile(
								oFormFile,
								appId,
								sSiteId
							);
							oCreatePromise.then(function (oData) {
								aFinalFiles.push(oData);
							});
							return oCreatePromise;
						}.bind(this)
					);

					Promise.all(aPromises)
						.then(
							function (aResolve) {
								this.aOldSiteAttachments[sSiteNo] = aFinalFiles;
								this.getModel("AttachmentsModel").setProperty("/attachments", aFinalFiles);
								sap.m.MessageToast.show("Site saved successfully");
								this.addSiteinTable(oSiteData, savesite, appId);
								this.getCalculateInspectionunits(appId);
								this.getView().byId("idSitesTable").removeSelections();
								this.getView().byId("idAddSiteRegtype").setEnabled(true);
								BusyIndicator.hide();
							}.bind(this)
						)
						.catch(
							function (oReject) {
								//Hide busy application
								BusyIndicator.hide();
								var errorMessage = oReject.error.responseJSON.message;
								if (typeof errorMessage !== "string") {
									errorMessage = errorMessage.message;
								}
								MessageBox.warning(errorMessage);
							}.bind(this)
						);
				} else {
					sap.m.MessageToast.show("Site saved successfully");
					this.addSiteinTable(oSiteData, savesite, appId);
					this.getCalculateInspectionunits(appId);
					this.getView().byId("idSitesTable").removeSelections();
					this.getView().byId("idAddSiteRegtype").setEnabled(true);
					BusyIndicator.hide();
				}
			},

			onDeleteItemPress: function (oEvent) {
				oEvent.getSource().destroy();
			},

			onFileSizeExceed: function () {
				sap.m.MessageToast.show(this.getResourceBundle().getText("fileSizeError"));
			},

			addSiteinTable: function (oData, savecopy, appId) {
				// this.getView().getModel("RegModel").getData().Sites.push(oData);
				// this.getView().getModel("RegModel").refresh(true);
				this.getSites(appId);
				if (savecopy) {
					this.getView().byId("idAddSiteForm").setVisible(false);
					this.getView().byId("idAddnewsiteBtn").setVisible(true);
					this.getView().byId("idAddnewsiteBtn").setText("Add another site");
				} else {
					this.createSitenumber();
					this.getView().getModel("SiteModel").setProperty("/Eastings", null);
					this.getView().getModel("SiteModel").setProperty("/Northings", null);
					this.getView().getModel("SiteModel").setProperty("/geometry", null);
					this.getView().getModel("SiteModel").refresh(true);
					this.getView().byId("idRegComments").setValue("");
				}
			},

			validAddsiteform: function () {
				var oGeometry = this.getModel("SiteModel").getProperty("/geometry");
				var sEastings = this.getModel("SiteModel").getProperty("/Eastings");
				var sNorthings = this.getModel("SiteModel").getProperty("/Northings");
				var Reinsdate = this.getView().byId("idReinstatementDatePicker").getDateValue();
				var selectedPosition = this.getView().byId("idAddSitePosition").getSelectedItem();
				var selectedRegistrationtype = this.getView().byId("idAddSiteRegtype").getSelectedItem();
				var SiteLocation = this.getView().byId("idSiteLocation").getValue();
				var Meslength = this.getView().byId("idLength").getValue();
				var MesWidth = this.getView().byId("idWidth").getValue();
				var MesDepth = this.getView().byId("idDepth").getValue();
				var Registrationcomments = this.getView().byId("idRegComments").getValue();
				var FinalReinstatement = this.getView().byId("idSegBtnFinalReInstmt").getSelectedKey();
				if (Reinsdate === null || selectedPosition === null || selectedRegistrationtype === null || SiteLocation.length === 0 || Meslength
					.length === 0 || Number(Meslength) > 9999.99 || !this.checkRegex(Number(Meslength)) || MesWidth.length === 0 || Number(
						MesWidth) > 99.99 || !this.checkRegex(Number(MesWidth)) || !this.checkRegex(Number(MesDepth)) ||
					MesDepth.length === 0 || Number(MesDepth) > 10 || FinalReinstatement === "" || (!oGeometry && (!sEastings || !sNorthings))) {
					if (Reinsdate === null) {
						this.setEnabledButtons(false);
					}
					if (selectedPosition === null) {
						this.setEnabledButtons(false);
					}
					if (selectedRegistrationtype === null) {
						this.setEnabledButtons(false);
					}
					if (SiteLocation.length === 0) {
						this.setEnabledButtons(false);
					}
					if (Meslength.length === 0 || Number(Meslength) > 9999.99 || !this.checkRegex(Number(Meslength))) {
						this.setEnabledButtons(false);
					}
					if (MesWidth.length === 0 || Number(MesWidth) > 99.99 || !this.checkRegex(Number(MesWidth))) {
						this.setEnabledButtons(false);
					}
					if (MesDepth.length === 0 || Number(MesDepth) > 10 || !this.checkRegex(Number(MesDepth))) {
						this.setEnabledButtons(false);
					}
					if (Registrationcomments.length === 0) {
						this.setEnabledButtons(false);
					}
					if (FinalReinstatement === "") {
						this.setEnabledButtons(false);
					}
					if (!oGeometry && (!sEastings || !sNorthings)) {
						this.setEnabledButtons(false);
					}
				} else {
					this.setEnabledButtons(true);
				}
			},

			setEnabledButtons: function (valid) {
				this.getView().byId("idAddSiteSaveCopyBtn").setEnabled(valid);
				this.getView().byId("idAddSiteSaveBtn").setEnabled(valid);
			},

			onViewSummary: function () {
				this.getView().byId("idRegisternavCon").to(this.byId("idRegisterp2"));
				this.getView().byId("idViewSummary").setVisible(false);
				this.getView().byId("idRegSave").setVisible(false);
				this.getView().byId("idSubmitRegistration").setVisible(true);
				this.getView().byId("idRegStep2").addStyleClass("clickBorder");
				this.getView().byId("idRegStep1").removeStyleClass("clickBorder");
				this.sendInspectionunits();
				this.getView().byId("messagePopoverBtn").setVisible(false);
			},

			onPressEdit: function () {
				this.getView().byId("idRegisternavCon").to(this.byId("idRegisterp1"));
				this.getView().byId("idViewSummary").setVisible(true);
				this.getView().byId("idRegSave").setVisible(true);
				this.getView().byId("idSubmitRegistration").setVisible(false);
				this.getView().byId("idRegStep1").addStyleClass("clickBorder");
				this.getView().byId("idRegStep2").removeStyleClass("clickBorder");
				this.getView().byId("messagePopoverBtn").setVisible(true);
			},

			onSavePress: function () {
				this.sendInspectionunits();
			},

			sendInspectionunits: function () {
				var CSRFToken = this.getOwnerComponent().getModel("RegModel").getProperty("/CSRFToken");
				var appId = this.getOwnerComponent().getModel("RegModel").getProperty("/isRegisterPermitId");
				var oData = {
					inspectionUnits: this.getOwnerComponent().getModel("RegModel").getProperty("/totalUnits")
				};
				$.ajax({
					type: "PUT",
					url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/applications/" + appId + "/inspection-units",
					contentType: "application/json",
					async: false,
					data: JSON.stringify(oData),
					headers: {
						"x-csrf-token": CSRFToken
					},
					success: function (data) {
						sap.m.MessageToast.show("Application saved successfully");
					}.bind(this),
					error: function (error) {
						var err = JSON.parse(error.responseText);
						MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
					}.bind(this)
				});
			},

			onSubmitRegistration: function () {
				MessageBox.confirm(
					"This is your last chance to edit any details before this permit is registered. \n \n Please ensure all details are correct before completing this registration", {
						title: "Please confirm all details",
						initialFocus: "i18n>ConfirmPermitRegistration",
						actions: [MessageBox.Action.CANCEL, "Confirm Permit Registration"],
						onClose: function (oAction) {
							if (oAction !== MessageBox.Action.CANCEL) {
								this.onSubmitRegister();
							}
						}.bind(this)
					});
			},

			onSubmitRegister: function () {
				var CSRFToken = this.getOwnerComponent().getModel("RegModel").getProperty("/CSRFToken");
				var appId = this.getOwnerComponent().getModel("RegModel").getProperty("/isRegisterPermitId");

				$.ajax({
					type: "POST",
					url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/applications/" + appId + "/sites/submission",
					contentType: "application/json",
					async: false,
					headers: {
						"x-csrf-token": CSRFToken
					},
					success: function (data) {
						sap.m.MessageToast.show("Application Registred successfully");
						this.oRouter.navTo("RegisterSubmit", null, true);
					}.bind(this),
					error: function (error) {
						var err = JSON.parse(error.responseText);
						MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
					}.bind(this)
				});
			},

			onTableSelectRow: function (evt) {
				this.getView().getModel("RegModel").setProperty("/tableButtons", true);
				this.selectedRow = evt.getParameter("listItem").getBindingContextPath();
				var Seldata = this.getOwnerComponent().getModel("RegModel").getProperty(this.selectedRow);
				if (Seldata.version && Seldata.version.toUpperCase() !== "DRAFT") {
					this.getView().getModel("RegModel").setProperty("/deleteButton", false);
				} else {
					this.getView().getModel("RegModel").setProperty("/deleteButton", true);
				}
			},

			onPressDelete: function () {
				MessageBox.confirm(
					"Do you want to delete site?", {
						title: this.getView().getModel("i18n").getResourceBundle().getText("Deletesite"),
						icon: MessageBox.Icon.WARNING,
						actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
						initialFocus: MessageBox.Action.CANCEL,
						onClose: function (oAction) {
							if (oAction === MessageBox.Action.OK) {
								this.DeleteSite();
							}
						}.bind(this)
					});
			},

			DeleteSite: function () {
				BusyIndicator.show(0);
				var siteId = this.getOwnerComponent().getModel("RegModel").getProperty(this.selectedRow + "/id"),
					appId = this.getOwnerComponent().getModel("RegModel").getProperty("/isRegisterPermitId");
				var CSRFToken = this.getOwnerComponent().getModel("RegModel").getProperty("/CSRFToken");
				$.ajax({
					type: "DELETE",
					url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/applications/" + appId + "/sites/" + siteId,
					contentType: "application/json",
					async: false,
					headers: {
						"x-csrf-token": CSRFToken
					},
					success: function (data) {
						sap.m.MessageToast.show("Site deleted successfully");
						this.getView().getModel("RegModel").setProperty("/tableButtons", false);
						this.getView().getModel("RegModel").setProperty("/deleteButton", false);
						this.getView().byId("idSitesTable").removeSelections();
						this.getSites(appId);
						this.getCalculateInspectionunits(appId);
						this.createSitenumber();
						BusyIndicator.hide();
					}.bind(this),
					error: function (error) {
						var err = JSON.parse(error.responseText);
						MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
						BusyIndicator.hide();
					}.bind(this)
				});
			},

			onPressCopy: function () {
				this.getView().byId("idAddSiteRegtype").setEnabled(true);
				this.getView().getModel("RegModel").setProperty("/tableButtons", false);
				this.getView().getModel("RegModel").setProperty("/deleteButton", false);
				this.getView().byId("idAddSiteForm").setVisible(true);
				this.addSiteModel();
				this.createSitenumber();
				this.getPosition();
				this.clearSiteForm();
				var Seldata = this.getOwnerComponent().getModel("RegModel").getProperty(this.selectedRow);
				this.getView().getModel("SiteModel").setProperty("/length", Seldata.length);
				this.getView().getModel("SiteModel").setProperty("/width", Seldata.width);
				this.getView().getModel("SiteModel").setProperty("/depth", Seldata.depth);
				this.getView().getModel("SiteModel").setProperty("/locationDescription", Seldata.locationDescription);
				this.getView().byId("idReinstatementDatePicker").setDateValue(new Date(Seldata.reinstatementDate));
				this.getView().byId("idAddSitePosition").setSelectedKey(Seldata.locationTypes);
				this.getView().byId("idAddSiteRegtype").setSelectedKey(Seldata.reinstatementStatus);
				this.getView().byId("idSegBtnFinalReInstmt").setSelectedKey(Seldata.finalReinstatement === true ? "Yes" : "No");
				this.validAddsiteform();
			},
			onPressEditTable: function () {
				var siteId = this.getOwnerComponent().getModel("RegModel").getProperty(this.selectedRow + "/id");
				var appId = this.getView().getModel("RegModel").getProperty("/isRegisterPermitId");
				BusyIndicator.show(0);
				ApiFacade.getInstance().getSiteEtag(appId, siteId)
					.then(function (data) {
						BusyIndicator.hide();
					}.bind(this))
					.catch(
						function (oReject) {
							this.standardAjaxErrorDisplay(oReject)
							BusyIndicator.hide();
						}.bind(this)
					);
				this.getView().getModel("RegModel").setProperty("/AddSiteNo", this.getOwnerComponent().getModel("RegModel").getProperty(this.selectedRow)
					.uiSiteNumber);
				this.replaceSiteAttachments();
				this.getView().getModel("RegModel").setProperty("/editClick", true);
				this.getView().getModel("RegModel").setProperty("/tableButtons", false);
				this.getView().getModel("RegModel").setProperty("/deleteButton", false);
				this.getView().byId("idAddSiteForm").setVisible(true);
				this.addSiteModel();
				this.getPosition();
				this.clearSiteForm();
				var Seldata = this.getOwnerComponent().getModel("RegModel").getProperty(this.selectedRow);
				if (Seldata.reinstatementStatus === "interim" && Seldata.permitReferenceNumber === this.getView().getModel("RegModel").getProperty("/PermitNo")) {
					this.getView().byId("idAddSiteRegtype").setEnabled(false);
				} else {
					this.getView().byId("idAddSiteRegtype").setEnabled(true);
				}
				this.getView().getModel("SiteModel").setProperty("/length", Seldata.length);
				this.getView().getModel("SiteModel").setProperty("/width", Seldata.width);
				this.getView().getModel("SiteModel").setProperty("/depth", Seldata.depth);
				this.getView().getModel("SiteModel").setProperty("/locationDescription", Seldata.locationDescription);
				this.getView().byId("idReinstatementDatePicker").setDateValue(new Date(Seldata.reinstatementDate));
				this.getView().byId("idAddSitePosition").setSelectedKey(Seldata.locationTypes);
				this.getView().byId("idAddSiteRegtype").setSelectedKey(Seldata.reinstatementStatus);
				this.getView().byId("idSegBtnFinalReInstmt").setSelectedKey(Seldata.finalReinstatement === true ? "Yes" : "No");
				if (Seldata.reinstatementCoordinates && Seldata.reinstatementCoordinates !== "") {
					this.getView().getModel("SiteModel").setProperty("/geometry", Seldata.reinstatementCoordinates);
					this.getView().getModel("SiteModel").setProperty("/Eastings", Seldata.reinstatementCoordinates.coordinates[0]);
					this.getView().getModel("SiteModel").setProperty("/Northings", Seldata.reinstatementCoordinates.coordinates[1]);
				}
				if (this.getView().getModel("RegModel").getData().appData.actualEndDate !== null) {
					this.getView().byId("idReinstatementDatePicker").setMaxDate(new Date(this.getView().getModel("RegModel").getData().appData.actualEndDate));
					var oMinDate = new Date(this.getView().getModel("RegModel").getData().appData.actualStartDate);
					oMinDate.setSeconds(oMinDate.getSeconds() + 1);
					this.getView().byId("idReinstatementDatePicker").setMinDate(oMinDate);
				}
				this.validAddsiteform();
			},

			/*OnSearchMap: function () {
				var oModelData = this.getModel("SiteModel").getData();
				var oRegModelData = this.getModel("RegModel").getData();
				if (oModelData.geometry) {
					this.openMap(oModelData.geometry.type, oModelData.geometry.coordinates);
				} else if (oRegModelData.geometry) {
					this.openMap(oRegModelData.geometry.type, oRegModelData.geometry.coordinates);
				} else {
					this.openMap();
				}
			},*/
	// New Function created for Cordinate on MAP		
			OnSearchMap: function () {
				var oModelData = this.getModel("SiteModel").getData();
				var oRegModelData = this.getModel("RegModel").getData();
				if (oModelData.geometry && oModelData.geometry.type && oModelData.geometry.coordinates) {
				this.openMap(oModelData.geometry.type, oModelData.geometry.coordinates);
				}
				else if (oRegModelData.appData.geometry && oRegModelData.appData.geometry.type && oRegModelData.appData.geometry
				.coordinates) {
				this.openMap(oRegModelData.appData.geometry.type, oRegModelData.appData.geometry.coordinates);
			} 
			else if (oModelData.Eastings && oModelData.Eastings !== "" && oModelData.Northings && oModelData.Northings !== "") {
				this.openMap("Point", [
					[oModelData.Eastings, oModelData.Northings]
				]);
			}
			else if (oRegModelData.Eastings && oRegModelData.Eastings !== "" && oRegModelData.Northings && oRegModelData.Northings !== "") {
				this.openMap("Point", [
					[oRegModelData.Eastings, oRegModelData.Northings]
				]);
			}
				
			 else {
					this.openMap();
				}
			},
//End of Function
			onMapClose: function () {
				this.getView().getModel("SiteModel").setProperty("/geometry", {
					type: this._oMapData.geometry.type,
					coordinates: this._oMapData.geometry.coordinates
				});
				if (this._oMapData.geometry.type === "Point") {
					this.getModel("SiteModel").setProperty("/Eastings", this._oMapData.geometry.coordinates[0]);
					this.getModel("SiteModel").setProperty("/Northings", this._oMapData.geometry.coordinates[1]);
				}
				this.validAddsiteform();
			}

			// getURLParameter: function (name) {
			// 	return decodeURIComponent((new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(location.search) || [""])[1].replace(
			// 		/\+/g,
			// 		"%20")) || null;
			// }
		});

	}

);
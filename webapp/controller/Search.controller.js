sap.ui.define([
	"project1/controller/base/BaseController",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"project1/services/apiFacade",
	"sap/ui/core/BusyIndicator",
	"project1/util/Formatter"
], function (BaseController, MessageBox, MessageToast, JSONModel, ApiFacade, BusyIndicator, Formatter) {
	"use strict";

	return BaseController.extend("project1.controller.Search", {
		formatter: Formatter,
		StartStopPermitDialog: null,
		startStopPermit: "",
		TableselectedRow: null,
		aOldAttachments: [],
		oInsItemIndex: [],
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("Search").attachPatternMatched(this.onRoutemacth, this);
			this.createmodel();
		},

		onRoutemacth: function (oEvent) {
			this.createmodel();
			this.getWorkCategories();
			this.getWorkingTypes();
			this.getInspectionType();
			this.getDNO();
			this.getWorkingGroup();
			this.clearData();
			var sTab = oEvent.getParameter("arguments").tab;
			if (sTab && sTab === "Inspections") {
				this.getModel("SearchModel").setProperty("/searchFor", "key2");
				this.onSelectSearchfor();
			}else if(sTab){
				this.getModel("SearchModel").setProperty("/SAPWorkOrderNo", sTab);
				this.getApplicationSearch();
				this._onValidationSearchButton();
			}
			this.getView().getModel("ExtendPermitModel").setProperty("/permitDetailClicked", false);
			this.getView().getModel("PermitJointingModel").setProperty("/permitDetailClicked", false);
			this.getView().getModel("oModel").setProperty("/isPrivateFault", false);
		},
		createmodel: function () {
			var data = {
				InspectionType: [],
				SearchArray: [],
				InspectionStatus: [],
				selectedInspectionStatus: "*",
				WorkReference: "",
				RequestId: "",
				IncidentNo: "",
				SAPWorkOrderNo: "",
				LicenceNumber: "",
				Street: "",
				Town: "",
				Area: "",
				InspectionId: "",
				RelatedPermitNo: "",
				// ProjectReference: "",
				DNO: [],
				WorkingGroup: "",
				RequestType: "",
				WorkType: "",
				WorkCategory: "",
				StartEndDate: "",
				Address: "",
				ExactLocation: "",
				PermitStatus: "",
				WorkStatus: "",
				searchButton: false,
				searchFor: "key1",
				createpermitselectedKey: "*"
			};
			var oModel = new JSONModel(data);
			this.getView().setModel(oModel, "SearchModel");
		},
		//Clear Data//
		clearData: function () {
			this.getView().byId("idSearchTable").setVisible(false);
			this.getView().byId("idAllPermitTypeHBox").setVisible(true);
			this.getView().byId("idInspectionsHBox").setVisible(false);
			var oModelData = this.getModel("SearchModel").getData();
			this.getView().byId("idSearchByMeChkbox").setVisible(true);
			var data = {
				InspectionType: oModelData.InspectionType,
				SearchArray: oModelData.SearchArray,
				InspectionStatus: oModelData.InspectionStatus,
				selectedInspectionStatus: "*",
				WorkReference: "",
				RequestId: "",
				IncidentNo: "",
				SAPWorkOrderNo: "",
				LicenceNumber: "",
				Street: "",
				Town: "",
				Area: "",
				InspectionId: "",
				RelatedPermitNo: "",
				// ProjectReference: "",
				DNO: oModelData.DNO,
				WorkingGroup: "",
				RequestType: "",
				WorkType: "",
				WorkCategory: "",
				StartEndDate: "",
				Address: "",
				ExactLocation: "",
				PermitStatus: "",
				WorkStatus: "",
				searchButton: false,
				searchFor: oModelData.searchFor
			};
			var oModel = new JSONModel(data);
			this.getView().setModel(oModel, "SearchModel");
			this.getView().getModel("SearchModel").setSizeLimit(999999);
			this.getView().byId("idIncidentNoInBox").setValueState("None");
			this.getView().byId("idRequestIdInBox").setValueState("None");
			this.getView().byId("idSearchByMeChkbox").setSelected(false);
			this.getView().byId("idWorkinggroupInBox").setValue("");
		},

		//Get Work Categories//
		getWorkCategories: function (event) {
			var oPromise = ApiFacade.getInstance().getStaticData("WORK_CATEGORY");
			oPromise.then(function (data) {
				this.setModel(new JSONModel(data), "workCategories");
			}.bind(this))
			.catch(
				function (oReject) {
					this.standardAjaxErrorDisplay(oReject)
				}.bind(this)
			);
			return oPromise;
		},

		//Get Working Type//
		getWorkingTypes: function (event) {
			var oPromise = ApiFacade.getInstance().getStaticData("WORK_TYPE");
			oPromise.then(function (data) {
				this.setModel(new JSONModel(data), "workingTypes");
			}.bind(this))
			.catch(
				function (oReject) {
					this.standardAjaxErrorDisplay(oReject)
				}.bind(this)
			);
			return oPromise;
		},

		//Get Inspection Type//
		getInspectionType: function (event) {
			var oCreatePromise = ApiFacade.getInstance().InspectionType();
			oCreatePromise.then(function (data) {
					this.getView().getModel("SearchModel").setProperty("/InspectionType", data);
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject)
					}.bind(this)
				);
		},

		//Get Application after search
		getApplicationSearch: function (event) {
			if (this.byId("idSearchViewTable")) {
				this.byId("idSearchViewTable").removeSelections();
				this.byId("createBtn").setVisible(false);
				this.byId("alterBtn").setVisible(false);
				this.byId("extndBtn").setVisible(false);
				this.byId("continueCreateBtn").setVisible(false);
				this.byId("continueAlterBtn").setVisible(false);
				this.byId("registerBtn").setVisible(false);
				this.byId("stopBtn").setVisible(false);
				this.byId("startBtn").setVisible(false);
				this.byId("attachBtn").setVisible(false);
				this.byId("cancelBtn").setVisible(false);
				this.byId("PAABtn").setVisible(false);
				this.byId("revertStartBtn").setVisible(false);
				this.byId("revertStopBtn").setVisible(false);
				this.byId("revertJointingBtn").setVisible(false);
				this.byId("completeJointingBtn").setVisible(false);
			}
			var oModelData = this.getModel("SearchModel").getData();
			var sincidentNumber = oModelData.IncidentNo;
			if (sincidentNumber !== "") {
				sincidentNumber = "INCD-" + sincidentNumber;
			}
			var selDNO;
			oModelData.DNO.forEach(function (item) {
				if (Number(oModelData.selectedDNO) === item.id) {
					selDNO = item.dno;
				}
			});
			var oData = {
				permitReferenceNumber: oModelData.WorkReference !== "" ? oModelData.WorkReference : oModelData.RelatedPermitNo,
				requestId: oModelData.RequestId,
				sapWorkOrder: oModelData.SAPWorkOrderNo,
				incidentNumber: sincidentNumber,
				licenseNumber: oModelData.LicenceNumber,
				street: oModelData.Street,
				town: oModelData.Town,
				area: oModelData.Area,
				dno: selDNO,
				inspectionId: oModelData.InspectionId,
				// projectReferenceNumber: oModelData.ProjectReference,
				type: oModelData.selectedInspectionType,
				workingGroup: oModelData.WorkingGroup,
				sendByMeFlag: this.byId("idSearchByMeChkbox").getSelected()
			};
			this._oFilters = oData;
			BusyIndicator.show(0);
			var oCreatePromise;
			if (oModelData.searchFor === "key1") {
				oCreatePromise = ApiFacade.getInstance().ApplicationSearch(oData);
			} else {
				oCreatePromise = ApiFacade.getInstance().InspectionSearch(oData);
			}
			oCreatePromise.then(function (data) {
					if (oModelData.searchFor === "key2") {
						this.getView().getModel("ExtendPermitModel").setProperty("/actionButton", data.length !== 0 ? data[0].actions : null);
						var aStatus = [];
						var aFinalStatus = [{
							key: "*",
							desc: this.getResourceBundle().getText("allStatus")
						}];
						data.forEach(function (oItem, index, object) {
							if (oItem.status.length !== 0) {
								oItem.workStatus = oItem.status[0].status;
								oItem.workStatusValue = oItem.status[0].status;
							}
							if (oItem.workStatus && !aStatus[oItem.workStatus]) {
								var oStatus = {
									key: oItem.workStatus,
									desc: oItem.workStatusValue
								};
								aStatus[oItem.workStatus] = oStatus;
								aFinalStatus.push(oStatus);
							}
							//Set due date and time from DFT
							if (oItem.dueDate === null || oItem.dueDate === "") {
								var isStartDate = oItem.startDate.split("Z")[0];
								this._getDueDateCalculation(oItem.inspectionType.toLowerCase(), oItem.category.toLowerCase(), oItem.outcome.toLowerCase(),
									isStartDate, index);
							} else {
								this.getView().getModel("SearchModel").setProperty("/SearchArray/" + index + "/dueDate", moment(oItem.dueDate).format(
									'DD MMM YYYY HH:mm'));
							}
							this.getView().getModel("SearchModel").setProperty("/SearchArray/" + index + "/startDate", moment(oItem.startDate).format(
								'DD MMM YYYY HH:mm'));
						}.bind(this));
						this.getView().getModel("SearchModel").setProperty("/InspectionStatus", aFinalStatus);
						this.getView().getModel("SearchModel").setProperty("/SearchArray", data);
						if (data.length === 0) {
							MessageBox.information(this.getModel("i18n").getResourceBundle().getText("resultnotfound"));
						}
					} else if (oModelData.searchFor === "key1") {
						// data = data.content;
						this.getView().getModel("ExtendPermitModel").setProperty("/actionButton", data.content.length !== 0 ? data.content[0].actions :
							null);
						this.getView().getModel("SearchModel").setProperty("/totalElements", data.totalElements);
						this._iTotalItems = data.totalElements;
						data.content.forEach(function (oItem) {
								if (oItem.workReferenceNumber !== null && oItem.licenseNumber !==null && oItem.licenseNumber!=="" ) {
									oItem.workReferenceNumber = oItem.workReferenceNumber + " / " + oItem.licenseNumber;
								}else if (oItem.workReferenceNumber === null && oItem.licenseNumber !== null ) {
									oItem.workReferenceNumber = oItem.licenseNumber;
								}
							}.bind(this));
						data.content.forEach(function (oItem) {
							if (oItem.workCategory === "immediate_urgent") {
								oItem.workCategory = "Urgent";
							} else if (oItem.workCategory === "immediate_emergency") {
								oItem.workCategory = "Emergency";
							}
						}.bind(this));
						this.getView().getModel("SearchModel").setProperty("/SearchArray", data.content);
						if (data.content.length === 0) {
							MessageBox.information(this.getModel("i18n").getResourceBundle().getText("resultnotfound"));
						}
					}
					this.getView().getModel("SearchModel").updateBindings();
					this.getView().byId("idSearchTable").setVisible(true);
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject)
					}.bind(this)
				);
		},

		loadPaginationItems: function () {
			BusyIndicator.show(0);
			var oModelData = this.getModel("SearchModel").getData();
			var aCurrentElements = oModelData.SearchArray;
			if (this._oFilters && aCurrentElements) {
				var oData = JSON.parse(JSON.stringify(this._oFilters));
				oData["skip"] = aCurrentElements.length;
				var oCreatePromise;
				if (oModelData.searchFor === "key1") {
					oCreatePromise = ApiFacade.getInstance().ApplicationSearch(oData);
				} else {
					oCreatePromise = ApiFacade.getInstance().InspectionSearch(oData);
				}
				oCreatePromise.then(function (data) {
						if (oModelData.searchFor === "key2") {
							data = oModelData.SearchArray.concat(data);
							this.getView().getModel("SearchModel").setProperty("/SearchArray", data);
							var aStatus = [];
							var aFinalStatus = [{
								key: "*",
								desc: this.getResourceBundle().getText("allStatus")
							}];
							data.forEach(function (oItem, index, object) {
								if (oItem.status.length !== 0) {
									oItem.workStatus = oItem.status[0].status;
									oItem.workStatusValue = oItem.status[0].status;
								}
								if (oItem.workStatus && !aStatus[oItem.workStatus]) {
									var oStatus = {
										key: oItem.workStatus,
										desc: oItem.workStatusValue
									};
									aStatus[oItem.workStatus] = oStatus;
									aFinalStatus.push(oStatus);
								}
								//Set due date and time from DFT
								if (oItem.dueDate === null || oItem.dueDate === "") {
									var isStartDate = oItem.startDate.split("Z")[0];
									this._getDueDateCalculation(oItem.inspectionType.toLowerCase(), oItem.category.toLowerCase(), oItem.outcome.toLowerCase(),
										isStartDate, index);
								} else {
									this.getView().getModel("SearchModel").setProperty("/SearchArray/" + index + "/dueDate", moment(oItem.dueDate).format(
										'DD MMM YYYY HH:mm'));
								}
								this.getView().getModel("SearchModel").setProperty("/SearchArray/" + index + "/startDate", moment(oItem.startDate).format(
									'DD MMM YYYY HH:mm'));
							}.bind(this));
							this.getView().getModel("SearchModel").setProperty("/InspectionStatus", aFinalStatus);
						} else if (oModelData.searchFor === "key1") {
							data.content.forEach(function (oItem) {
								if (oItem.workReferenceNumber !== null && oItem.licenseNumber !==null && oItem.licenseNumber!=="" ) {
									oItem.workReferenceNumber = oItem.workReferenceNumber + " / " + oItem.licenseNumber;
								}else if (oItem.workReferenceNumber === null && oItem.licenseNumber !== null ) {
									oItem.workReferenceNumber = oItem.licenseNumber;
								}
							}.bind(this));
							if (JSON.stringify(oModelData.SearchArray) !== JSON.stringify(data.content)) {
								data = oModelData.SearchArray.concat(data.content);
							} else {
								data = data.content;
							}
							this.getView().getModel("SearchModel").setProperty("/SearchArray", data);
							
							data.forEach(function (oItem) {
								if (oItem.workCategory === "immediate_urgent") {
									oItem.workCategory = "Urgent";
								} else if (oItem.workCategory === "immediate_emergency") {
									oItem.workCategory = "Emergency";
								}
							}.bind(this));
						}
						this.getView().getModel("SearchModel").updateBindings();
						BusyIndicator.hide();
					}.bind(this))
					.catch(
						function (oReject) {
							BusyIndicator.hide();
							this.standardAjaxErrorDisplay(oReject)
						}.bind(this)
					);
			}
		},

		//Inspections DNO
		getDNO: function (event) {
			var oCreatePromise = ApiFacade.getInstance().InspectionsDNO();
			oCreatePromise.then(function (data) {
					var uniqueArray = [];
					var filterArray = [];
					for (var i = 0; i < data.length; i++) {
						if (uniqueArray.indexOf(data[i].dno) === -1) {
							uniqueArray.push(data[i].dno);
							filterArray.push(data[i]);
						}
					}
					this.getView().getModel("SearchModel").setProperty("/DNO", filterArray);
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject)
					}.bind(this)
				);
		},
		getWorkingGroup: function () {
			var oCreatePromise = ApiFacade.getInstance().getWorkingGroup();
			oCreatePromise.then(function (data) {
					var model = new JSONModel(data);
					model.setSizeLimit(data.length);
					this.getView().setModel(model, "SuggestModel");
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject)
					}.bind(this)
				);

		},
		//Public Function//
		onHome: function () {
			this.clearData();
			this.oRouter.navTo("RouteHome", null, true);
		},
		onSelectSearchfor: function () {
			this.clearData();
			if (this.byId("idSearchfor").getSelectedKey() === "key1") {
				this.getView().byId("idAllPermitTypeHBox").setVisible(true);
				this.getView().byId("idInspectionsHBox").setVisible(false);
				this.getView().byId("idSearchTable").setVisible(false);
				this.getView().byId("idIncidentNoInBox").setValueState("None");
				this.getView().byId("idRequestIdInBox").setValueState("None");
				this.getView().byId("idSearchByMeChkbox").setVisible(true);
			} else {
				this.getView().byId("idAllPermitTypeHBox").setVisible(false);
				this.getView().byId("idInspectionsHBox").setVisible(true);
				this.getView().byId("idSearchTable").setVisible(false);
				this.getView().byId("idSearchByMeChkbox").setVisible(false);
			}
		},

		OnSearchPress: function () {
			if(this.getModel("SearchModel").getProperty("/searchButton")){
				// var incidentNumber = this.getView().byId("idIncidentNoInBox").getValue().trim();
				var incidentNumber = this.getView().byId("idIncidentNoInBox").getValue();
				var requestId = this.getView().byId("idRequestIdInBox").getValue().trim();
				var aErrors = [];
				if (incidentNumber !== "") {
					var sErrorText = this._onIncidentNumberValidation("idIncidentNoInBox");
					if (sErrorText !== null) {
						aErrors.push(sErrorText);
					}
				}
				if (requestId !== "") {
					var sRequestIdErrorText = this._onRequestIdValidation("idRequestIdInBox");
					if (sRequestIdErrorText !== null) {
						aErrors.push(sRequestIdErrorText);
					}
				}
				if (aErrors.length === 0) {
					this.getApplicationSearch();
				} else {
					sap.m.MessageToast.show(aErrors.join("\r\n"));
				}
				// this.getApplicationSearch();
			}
		},

		onTableSelectRow: function (evt) {
			this.TableselectedRow = this.getModel("SearchModel").getProperty(evt.getParameter("listItem").getBindingContext("SearchModel").getPath());
			this.getView().getModel("ExtendPermitModel").setProperty("/data", this.TableselectedRow);
			this.getView().getModel("PermitJointingModel").setProperty("/applicationId", this.TableselectedRow.applicationId);
			this.getView().getModel("PermitJointingModel").setProperty("/actualStartDate", this.TableselectedRow.actualStartDate);
			this.getView().getModel("PermitJointingModel").setProperty("/actualEndDate", this.TableselectedRow.actualEndDate);
			this.getView().getModel("PermitJointingModel").setProperty("/proposedEndDate", this.TableselectedRow.proposedEndDate);

			this.getView().getModel("PermitCancelModel").setProperty("/applicationId", this.TableselectedRow.applicationId);
			this.getView().getModel("PermitRevertModel").setProperty("/applicationId", this.TableselectedRow.applicationId);
			var aActions = this.TableselectedRow.actions;
			this.byId("createBtn").setVisible(false);
			this.byId("alterBtn").setVisible(false);
			this.byId("continueCreateBtn").setVisible(false);
			this.byId("continueAlterBtn").setVisible(false);
			this.byId("registerBtn").setVisible(false);
			this.byId("extndBtn").setVisible(false);
			this.byId("stopBtn").setVisible(false);
			this.byId("startBtn").setVisible(false);
			this.byId("attachBtn").setVisible(false);
			this.byId("cancelBtn").setVisible(false);
			this.byId("PAABtn").setVisible(false);
			this.byId("revertStartBtn").setVisible(false);
			this.byId("revertStopBtn").setVisible(false);
			this.byId("revertJointingBtn").setVisible(false);
			this.byId("completeJointingBtn").setVisible(false);
			if (aActions) {
				aActions.forEach(function (sAction) {
					switch (sAction) {
					case "new-permit":
						if (this.TableselectedRow.newPhaseApplicationId) {
							this.byId("continueCreateBtn").setVisible(true);
						} else {
							this.byId("createBtn").setVisible(true);
						}
						break;
					case "alteration":
						if (this.TableselectedRow.draftApplicationId && this.TableselectedRow.draftAlterationId) {
							this.byId("continueAlterBtn").setVisible(true);
						} else {
							this.byId("alterBtn").setVisible(true);
						}
						break;
					case "register":
						this.byId("registerBtn").setVisible(true);
						break;
					case "stop":
						this.byId("stopBtn").setVisible(true);
						break;
					case "start":
						this.byId("startBtn").setVisible(true);
						break;
					case "cancel":
						this.byId("cancelBtn").setVisible(true);
						break;
					case "proceed-to-pa":
						if (this.TableselectedRow.newPhaseApplicationId) {
							this.byId("ContinuePAABtn").setVisible(true);
						} else {
							this.byId("PAABtn").setVisible(true);
						}
						break;
					case "add-attachment":
						//this.byId("attachBtn").setVisible(true);
						break;
					case "extension-request":
						this.byId("extndBtn").setVisible(true);
						break;
					case "revert-start":
						this.byId("revertStartBtn").setVisible(true);
						break;
					case "revert-stop":
						this.byId("revertStopBtn").setVisible(true);
						break;
					case "revert-jointing":
						this.byId("revertJointingBtn").setVisible(true);
						break;
					case "confirm-jointing":
						this.byId("completeJointingBtn").setVisible(true);
						break;
					}
				}.bind(this));
			}
		},

		handleUserInput: function (oEvent) {
			this.getModel("SearchModel").setProperty(oEvent.getSource().getBindingPath("value"), oEvent.getSource().getValue());
			this._onValidationSearchButton();
		},

		handleUserInputWorkingGr: function (evt) {
			if (evt.getSource().getValue() !== evt.getSource().getProperty("value")) {
				this.getModel("SearchModel").setProperty(evt.getSource().getBindingPath("value"), evt.getSource().getValue());
				this._onValidationSearchButton();
				this.getView().getModel("SearchModel").setProperty("/WorkingGroup", "");
			}
		},

		onClickAppId: function (evt) {
			var sIncidentNumber = evt.getSource().getBindingContext("SearchModel").getObject().incidentReference;
			var sApplicationId = evt.getSource().getBindingContext("SearchModel").getObject().applicationId;
			var sWorkType = evt.getSource().getBindingContext("SearchModel").getObject().workType;
			if (sIncidentNumber === "" || sIncidentNumber === null) {
				if(sWorkType.toLowerCase().indexOf("private") !== -1){
					this.doNavTo("PlannedPrivate", {
						mode: "edit",
						NAME1: "ApplicationId",
						PARAM1: sApplicationId
					});
				}else{
					this.doNavTo("PlannedPermit", {
						mode: "edit",
						NAME1: "ApplicationId",
						PARAM1: sApplicationId
					});
				}
			} else {
				if(sWorkType.toLowerCase().indexOf("private") !== -1){
					this.doNavTo("FaultPrivate", {
						mode: "edit",
						NAME1: "ApplicationId",
						PARAM1: sApplicationId
					});
				}else{
					this.doNavTo("FaultPermit", {
						mode: "edit",
						NAME1: "ApplicationId",
						PARAM1: sApplicationId
					});
				}
			}
		},

		onClickIncdId: function (evt) {
			var sIncidentNumber = evt.getSource().getBindingContext("SearchModel").getObject().incidentReference;
			this.doNavTo("FaultPermit", {
				state: sIncidentNumber
			});
		},

		onClickInspectionId: function (evt) {
			var sPermitReferenceNumber = evt.getSource().getBindingContext("SearchModel").getObject().permitReferenceNumber;
			var sInspectionId = evt.getSource().getBindingContext("SearchModel").getObject().inspectionId;
			if(sPermitReferenceNumber){
				this.doNavTo("PermitHistory", {
					tab: "Inspectionhistory",
					NAME1: "permitReferenceNumber",
					PARAM1: sPermitReferenceNumber,
				});
			}else{
				this.doNavTo("Inspection", {
					state: sInspectionId,
					mode: "inspection-detail"
				});
			}
		},

		onsuggestionItemSelected: function (evt) {
			if(evt.getParameter("selectedItem")){
				this.getView().getModel("SearchModel").setProperty("/WorkingGroup", evt.getParameter("selectedItem").getKey());
				this.getView().getModel("SearchModel").setProperty("/searchButton", true);
			}else{
				this.getView().getModel("SearchModel").setProperty("/WorkingGroup", null);
				this._onValidationSearchButton();
			}
		},

		onPressStartStop: function (startStopPermit) {
			// var bWorkStatus = this.getView().byId("idSearchViewTable").getSelectedItem().getBindingContext("SearchModel").getObject().workStatusValue;
			// if (bWorkStatus.trim().toLowerCase() !== "in progress" && startStopPermit !== "Start") {
			// 	MessageBox.warning(this.getView().getModel("i18n").getResourceBundle().getText("WorkStatus_Error"));
			// } else {
			this.startStopPermit = startStopPermit;
			this.getView().getModel("SearchModel").setProperty("/startStopPermit", startStopPermit);
			if (!this.StartStopPermitDialog) {
				this.StartStopPermitDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.StartStopPermit", this);
				this.getView().addDependent(this.StartStopPermitDialog);
			}
			sap.ui.getCore().byId("idDialogStartPermit").setTitle(startStopPermit + " " + this.getView().getModel("i18n").getResourceBundle().getText(
				"StartstopPermit"));

			if (this.startStopPermit === "Start") {
				var proposedDate = this.getView().byId("idSearchViewTable").getSelectedItem().getBindingContext("SearchModel").getObject().proposedStartDate;
				var proposedEDate = this.getView().byId("idSearchViewTable").getSelectedItem().getBindingContext("SearchModel").getObject().proposedEndDate;
				// sap.ui.getCore().byId("idSearchStartdateTime").setMaxDate(new Date());
				// sap.ui.getCore().byId("idSearchStartdateTime").setMaxDate(new Date(proposedEndDate));
				var proposeStartDate = new Date(proposedDate);
				var currentDate = new Date();
				var proposedEndDate = new Date(proposedEDate);
				if (proposeStartDate < currentDate && currentDate < proposedEndDate || proposedEndDate < currentDate) {
					sap.ui.getCore().byId("idSearchStartdateTime").setMinDate(new Date(proposedDate));
					if (proposedEndDate < currentDate) {
						sap.ui.getCore().byId("idSearchStartdateTime").setMaxDate(new Date(proposedEndDate));
					} else {
						sap.ui.getCore().byId("idSearchStartdateTime").setMaxDate(new Date());
					}
					sap.ui.getCore().byId("idSearchStartdateTime").setInitialFocusedDateValue(new Date());
					this.StartStopPermitDialog.open();
				} else if (proposeStartDate === currentDate && currentDate < proposedEndDate) {
					sap.ui.getCore().byId("idSearchStartdateTime").setMinDate(new Date());
					sap.ui.getCore().byId("idSearchStartdateTime").setMaxDate(new Date());
					sap.ui.getCore().byId("idSearchStartdateTime").setInitialFocusedDateValue(new Date());
					this.StartStopPermitDialog.open();
				} else if (proposeStartDate > currentDate) {
					MessageBox.show(this.getView().getModel("i18n").getResourceBundle().getText("Actual_Start_Date_Message_future"));
				}
				// else {
				// 	this.StartStopPermitDialog.close();
				// 	MessageBox.show(this.getView().getModel("i18n").getResourceBundle().getText("Actual_Start_Date_Message_past"));
				// }
			} else {
				var actualStartdate = this.getView().byId("idSearchViewTable").getSelectedItem().getBindingContext("SearchModel").getObject().proposedStartDate;
				sap.ui.getCore().byId("idSearchStartdateTime").setMinDate(new Date(actualStartdate));
				sap.ui.getCore().byId("idSearchStartdateTime").setInitialFocusedDateValue(new Date());
				this.StartStopPermitDialog.open();
			}
			// sap.ui.getCore().byId("idSearchStartdateTime").setDateValue(null);
			// this.StartStopPermitDialog.open();
			// }
		},

		onPressCancel: function () {
			this.StartStopPermitDialog.close();
			this.StartStopPermitDialog.destroy();
			this.StartStopPermitDialog = null;
		},

		onPressConfirm: function () {
			var SelDate = sap.ui.getCore().byId("idSearchStartdateTime").getDateValue();
			if (SelDate === null) {
				MessageBox.warning(this.startStopPermit === "Start" ? this.getView().getModel("i18n").getResourceBundle().getText(
					"SearchStartdateTime_Error") : this.getView().getModel("i18n").getResourceBundle().getText("SearchEnddateTime_Error"));
			} else {
				BusyIndicator.show(0);
				var appId = this.getView().byId("idSearchViewTable").getSelectedItem().getBindingContext("SearchModel").getObject().applicationId;
				this.StartStopPermitDialog.close();
				this.StartStopPermitDialog.destroy();
				this.StartStopPermitDialog = null;
				if (this.startStopPermit === "Start") {
					var action = "start";
				} else {
					action = "stop";
				}
				var requestActionPayload = {
					date: SelDate
				};
				// var oCreatePromise = ApiFacade.getInstance().createStartStopPermit(appId, SelDate, this.startStopPermit);
				var oCreatePromise = ApiFacade.getInstance().createActionpPermit(appId, action, requestActionPayload);
				oCreatePromise.then(function (data) {
						BusyIndicator.hide();
						this.getApplicationSearch();
						// this.StartStopPermitDialog.close();
						if (this.startStopPermit === "Start") {
							MessageBox.success(this.getView().getModel("i18n").getResourceBundle().getText("Permit_start_success") + " - " + this.formatter
								.DateFormatMoment(SelDate));
						} else {
							MessageBox.success(this.getView().getModel("i18n").getResourceBundle().getText("Permit_stop_success") + " - " + this.formatter
								.DateFormatMoment(SelDate));
						}
					}.bind(this))
					.catch(
						function (oReject) {
							BusyIndicator.hide();
							// this.StartStopPermitDialog.close();
							var errorMessage = oReject.error.responseJSON.message;
							if (typeof errorMessage !== "string") {
								errorMessage = errorMessage.message;
							} else if (this.IsJsonString(errorMessage)) {
								errorMessage = JSON.parse(errorMessage).message;
							}
							if (this.startStopPermit === "Start") {
								MessageBox.error(errorMessage);
							} else {
								MessageBox.error(errorMessage + "\n \n" + this.getView().getModel("i18n").getResourceBundle().getText(
									"UKPN_Admin_Submission_error"));
							}
						}.bind(this)
					);
			}
		},
		onSearchSelect: function (evt) {
			if (evt.getParameters().selected === true && this.getView().getModel("SearchModel").getProperty("/searchFor") === "key1") {
				this.getView().getModel("SearchModel").setProperty("/searchButton", true);
			} else {
				this.getView().getModel("SearchModel").setProperty("/searchButton", false);
			}
			this._onValidationSearchButton();
		},
		onLinkWorkReference: function (evt) {
			this.getView().getModel("ExtendPermitModel").setProperty("/permitDetailClicked", true);
			this.getView().getModel("PermitRevertModel").setProperty("/permitDetailClicked", true);
			this.getView().getModel("PermitJointingModel").setProperty("/permitDetailClicked", true);
			var permitReferenceNumber = evt.getSource().getBindingContext("SearchModel").getObject().applicationId;
			// this.getOwnerComponent().getModel("PermitHistory").setProperty("/selectedTab", "Permitdetails");
			// this.getOwnerComponent().getModel("PermitHistory").setProperty("/permitReferenceNumber", permitReferenceNumber);
			// this.oRouter.navTo("PermitHistory", null, true);
			this.doNavTo("PermitHistory", {
				tab: "Permitdetails",
				NAME1: "requestId",
				PARAM1: permitReferenceNumber
			});
		},
		onPressNewPermit: function (evt) {
			var sIncidentNumber = this.TableselectedRow.incidentReference;
			var sPermitReferenceNumber = this.TableselectedRow.permitReferenceNumber;
			if (sIncidentNumber === "" || sIncidentNumber === null) {
				this.doNavTo("PlannedPermit", {
					mode: "create",
					NAME1: "PermitReference",
					PARAM1: sPermitReferenceNumber
				});
			} else {
				this.doNavTo("FaultPermit", {
					mode: "edit",
					NAME1: "PermitReference",
					PARAM1: sPermitReferenceNumber
				});
			}
		},

		onPressAlterPermit: function (bContinue) {
			if (bContinue) {
				if (this.TableselectedRow.draftWorkType.toLowerCase() === "immediate") {
					this.doNavTo("FaultPermit", {
						mode: "AlterPermit",
						NAME1: "ApplicationId",
						PARAM1: this.TableselectedRow.applicationId + "_AlterationId=" + this.TableselectedRow.draftApplicationId + "&" + this.TableselectedRow
							.draftAlterationId
					});
				} else if(this.TableselectedRow.draftWorkType.toLowerCase() === "planned"){
					this.doNavTo("PlannedPermit", {
						mode: "AlterPermit",
						NAME1: "ApplicationId",
						PARAM1: this.TableselectedRow.applicationId + "_AlterationId=" + this.TableselectedRow.draftApplicationId + "&" + this.TableselectedRow
							.draftAlterationId
					});
				} else if(this.TableselectedRow.draftWorkType.toLowerCase() === "private_immediate"){
					this.doNavTo("FaultPrivate", {
						mode: "AlterPermit",
						NAME1: "ApplicationId",
						PARAM1: this.TableselectedRow.applicationId + "_AlterationId=" + this.TableselectedRow.draftApplicationId + "&" + this.TableselectedRow
							.draftAlterationId
					});
				} else if(this.TableselectedRow.draftWorkType.toLowerCase() === "private_planned"){
					this.doNavTo("PlannedPrivate", {
						mode: "AlterPermit",
						NAME1: "ApplicationId",
						PARAM1: this.TableselectedRow.applicationId + "_AlterationId=" + this.TableselectedRow.draftApplicationId + "&" + this.TableselectedRow
							.draftAlterationId
					});
				}
			} else {
				if (this.TableselectedRow.workType.toLowerCase() === "planned") {
					this.doNavTo("PlannedPermit", {
						mode: "AlterPermit",
						NAME1: "PermitReference",
						PARAM1: this.TableselectedRow.permitReferenceNumber
					});
				} else if (this.TableselectedRow.workType.toLowerCase() === "immediate") {
					this.doNavTo("FaultPermit", {
						mode: "AlterPermit",
						NAME1: "PermitReference",
						PARAM1: this.TableselectedRow.permitReferenceNumber
					});
				} else if(this.TableselectedRow.workType.toLowerCase() === "private_immediate"){
					this.doNavTo("FaultPrivate", {
						mode: "AlterPermit",
						NAME1: "PermitReference",
						PARAM1: this.TableselectedRow.permitReferenceNumber
					});
				} else if(this.TableselectedRow.workType.toLowerCase() === "private_planned"){
					this.doNavTo("PlannedPrivate", {
						mode: "AlterPermit",
						NAME1: "PermitReference",
						PARAM1: this.TableselectedRow.permitReferenceNumber
					});
				}
			}
		},

		onPressPAA: function (bContinue) {
			if (bContinue) {
				this.doNavTo("PlannedPermit", {
					mode: "PAA",
					NAME1: "DraftApplicationId",
					PARAM1: this.TableselectedRow.newPhaseApplicationId
				});
			} else {
				this.doNavTo("PlannedPermit", {
					mode: "PAA",
					NAME1: "PermitReference",
					PARAM1: this.TableselectedRow.permitReferenceNumber
				});
			}
		},

		onPressRegister: function () {
			this.doNavTo("RegisterPermit", {
				state: this.TableselectedRow.applicationId
			});
		},

		// onPressCancelAction: function () {
		// 	if (!this.CancelPermitDialog) {
		// 		this.CancelPermitDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.CancelPermit", this);
		// 		this.getView().addDependent(this.CancelPermitDialog);
		// 	}
		// 	this.CancelPermitDialog.open();
		// },

		onDeleteItemPress: function (oEvent) {
			oEvent.getSource().destroy();
		},

		onFileSizeExceed: function () {
			MessageToast.show(this.getResourceBundle().getText("fileSizeError"));
		},

		AttachmentDialog: null,
		onPressAddAttachments: function () {
			this.aOldAttachments = [];
			this.setModel(new JSONModel({
				attachments: []
			}), "AttachmentsModel");
			this.AttachmentDialog = null;
			if (!this.AttachmentDialog) {
				this.AttachmentDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.AddAttachment", this);
				this.getView().addDependent(this.AttachmentDialog);
			}
			this.AttachmentDialog.open();
		},

		onCloseAttachDialog: function () {
			this.AttachmentDialog.close();
			this.AttachmentDialog.destroy();
			this.AttachmentDialog = null;
		},

		updateAttachments: function () {
			var aItems = sap.ui.getCore().byId("uploadCollection").getItems();
			var aFormFiles = [];
			var aFinalFiles = [];

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

				BusyIndicator.show(0);
				var aPromises = [];

				aFormFiles.forEach(function (oFormFile) {
					var oCreatePromise = ApiFacade.getInstance().createApplicationFile(
						oFormFile,
						this.TableselectedRow.applicationId
					);
					oCreatePromise.then(function (oData) {
						aFinalFiles.push(oData);
					});
					aPromises.push(oCreatePromise);
				}.bind(this));

				Promise.all(aPromises)
					.then(
						function () {
							this.aOldAttachments = aFinalFiles;
							this.getModel("AttachmentsModel").setProperty("/attachments", aFinalFiles);
							this.AttachmentDialog.close();
							this.AttachmentDialog.destroy();
							this.AttachmentDialog = null;
							BusyIndicator.hide();
							sap.m.MessageToast.show(this.getResourceBundle().getText("attachmentsSaved"));
						}.bind(this)
					)
					.catch(
						function (oReject) {
							//Hide busy application
							BusyIndicator.hide();
							this.standardAjaxErrorDisplay(oReject)
						}.bind(this)
					);
			} else {
				sap.m.MessageToast.show(this.getResourceBundle().getText("noAttachments"));
			}
		},

		//Private Function//		
		_onIncidentNumberValidation: function (sId) {
			var oInput = this.getView().byId(sId);
			var incidentNumber = this.getView().byId("idIncidentNoInBox").getValue().trim();
			incidentNumber = "INCD-" + incidentNumber;
			// var regEx = /^INCD\-\d{8}\-\w$/;
			// var regEx = /INCD\-\d[0-9]{0,8}\-\w$/;
			var regEx = /^INCD\-\d{1,8}\-\w$/;
			if (incidentNumber !== null) {
				if (!regEx.test(incidentNumber)) {
					oInput.setValueState("Error");
					oInput.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("Incident_number_error"));
					return (this.getView().getModel("i18n").getResourceBundle().getText("Incident_number_error"));
				} else {
					oInput.setValueState("None");
					return null;
				}
			}
		},
		_onRequestIdValidation: function (sId) {
			var oInput = this.getView().byId(sId);
			var requestId = this.getView().byId("idRequestIdInBox").getValue().trim();
			var regEx = /^\d[0-9]*/;
			if (requestId !== null) {
				if (!regEx.test(requestId)) {
					oInput.setValueState("Error");
					oInput.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("Request_id_error"));
					return (this.getView().getModel("i18n").getResourceBundle().getText("Request_id_error"));
				} else {
					oInput.setValueState("None");
					return null;
				}
			}
		},
		_onValidationSearchButton: function () {
			var bEnabled = false;
			var oModelData = this.getModel("SearchModel").getData();
			for (var i in oModelData) {
				if (i !== "searchFor" && i !== "selectedInspectionStatus") {
					if (oModelData[i] && typeof oModelData[i] === "string" && oModelData[i] !== "" || this.byId("idSearchByMeChkbox").getSelected()) {
						bEnabled = true;
					}
				}
			}
			this.getView().getModel("SearchModel").setProperty("/searchButton", bEnabled);
		},

		onPressCreatePermit: function (bContinue) {
			if (bContinue) {
				if (this.TableselectedRow.newPhaseWorkType.toLowerCase() === "immediate") {
					this.doNavTo("FaultPermit", {
						mode: "edit",
						NAME1: "ApplicationId",
						PARAM1: this.TableselectedRow.newPhaseApplicationId
					});
				} else if(this.TableselectedRow.newPhaseWorkType.toLowerCase() === "planned"){
					this.doNavTo("PlannedPermit", {
						mode: "edit",
						NAME1: "ApplicationId",
						PARAM1: this.TableselectedRow.newPhaseApplicationId
					});
				} else if(this.TableselectedRow.newPhaseWorkType.toLowerCase() === "private_immediate"){
					this.doNavTo("FaultPrivate", {
						mode: "edit",
						NAME1: "ApplicationId",
						PARAM1: this.TableselectedRow.newPhaseApplicationId
					});
				} else if(this.TableselectedRow.newPhaseWorkType.toLowerCase() === "private_planned"){
					this.doNavTo("PlannedPrivate", {
						mode: "edit",
						NAME1: "ApplicationId",
						PARAM1: this.TableselectedRow.newPhaseApplicationId
					});
				}
			} else {
				if (!this.createPermitDialog) {
					this.createPermitDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.CreatePermit", this);
					this.getView().addDependent(this.createPermitDialog);
				}
				this.getView().getModel("SearchModel").setProperty("/createpermitselectedKey", "");
				this.createPermitDialog.open();
			}
		},

		oncreateCancel: function () {
			this.createPermitDialog.close();
			this.createPermitDialog.destroy();
			this.createPermitDialog = null;
		},

		onPressCreateConfirm: function () {
			var selectedkey = this.getView().getModel("SearchModel").getProperty("/createpermitselectedKey");
			this.createPermitDialog.close();
			this.createPermitDialog.destroy();
			this.createPermitDialog = null;
			if (selectedkey === "CreatePermit") {
				if(this.TableselectedRow.workType.toLowerCase().indexOf("private") !== -1){
					this.doNavTo("PlannedPrivate", {
						mode: "create",
						NAME1: "PermitReference",
						PARAM1: this.TableselectedRow.permitReferenceNumber
					});
				}else{
					this.doNavTo("PlannedPermit", {
						mode: "create",
						NAME1: "PermitReference",
						PARAM1: this.TableselectedRow.permitReferenceNumber
					});
				}
			} else if (selectedkey === "FaultPermit") {
				if(this.TableselectedRow.workType.toLowerCase().indexOf("private") !== -1){
					this.doNavTo("FaultPrivate", {
						mode: "create",
						NAME1: "PermitReference",
						PARAM1: this.TableselectedRow.permitReferenceNumber
					});
				}else{
					this.doNavTo("FaultPermit", {
						mode: "create",
						NAME1: "PermitReference",
						PARAM1: this.TableselectedRow.permitReferenceNumber
					});
				}
			} else {
				MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("CreatePermit_Error"));
			}
		},

		_getDueDateCalculation: function (isInstype, isCategory, isOutcome, isDate, index) {
			if (isInstype !== null && isCategory !== null && isOutcome !== null) {
				var oCreatePromise = ApiFacade.getInstance().getInspectionduedatecalculation(isInstype, isCategory, isOutcome, isDate);
				oCreatePromise.then(function (data) {
						if (data.dueDate !== "N/A") {
							this.getView().getModel("SearchModel").setProperty("/SearchArray/" + index + "/dueDate", moment(data.dueDate).format(
								'DD MMM YYYY HH:mm'));
						}
					}.bind(this))
					.catch(
						function (oReject) {
							this.standardAjaxErrorDisplay(oReject)
						}.bind(this)
					);
			}
		},
		
		DateFormatwithoutTime: function (date) {
				var dateFormatted;
				if (date !== "" && date !== undefined && date !== null) {
					dateFormatted = moment(date).format('DD MMM YYYY');
				}
				return dateFormatted;
		}
	});
});
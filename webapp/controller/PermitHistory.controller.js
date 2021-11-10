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

	return BaseController.extend("project1.controller.PermitHistory", {
		formatter: Formatter,
		aOldAttachments: [],
		appId: null,
		inspectionIdonPressStartStop: null,
		permitReferenceNumber: null,
		bUpdatePermitDetails: false,
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("PermitHistory").attachPatternMatched(this.onRoutemacth, this);
		},

		onRoutemacth: function (evt) {
			var sTab = evt.getParameter("arguments").tab;
			var sPermitReference = evt.getParameter("arguments").Permitreference;
			var sInspectionReference = evt.getParameter("arguments").Inspectionreference;
			var sParam1 = evt.getParameter("arguments").PARAM1;
			var sName1 = evt.getParameter("arguments").NAME1;
			this.appId = null;
			this.permitReferenceNumber = null;
			this.inspectionId = null;
			this._createModel();
			this._createVersionHistoryModel();
			this._createEventHistoryModel();
			this._createSitesHistoryModel();
			this._createActivitiesModel();
			this._getTopics();
			this._createInspectionHistoryModel();
			this._createCommentsAttachmentsModel();
			var aPromises = [];
			aPromises.push(this._getAssesmentReasons());
			aPromises.push(this._getAssesmentStatus());
			aPromises.push(this._getInspectionStatus());
			aPromises.push(this._getPositions());
			aPromises.push(this._getWorkTypes());
			aPromises.push(this._getWorkCategories());
			aPromises.push(this._getContractorAll());
			aPromises.push(this._getWorkIdentifier());
			aPromises.push(this._getCollaborationType());
			aPromises.push(this._getHighwayAuthority());
			aPromises.push(this._getHighwayAuthorityContacts());
			aPromises.push(this._getWorkinggroup());
			this.clearData();
			Promise.all(aPromises).then(function(aData){
				this.getView().getModel("oModel").setProperty("/isPrivateFault", false);
				this.getView().getModel("oModel").setProperty("/isPrivatePlanned", false);
				this.getView().getModel("oModel").setProperty("/isFaultPermit", false);

				var oData;
				this.getOwnerComponent().getModel("PermitHistory").setProperty("/selectedTab", sTab);

				if (sTab === "Permitdetails") {
					this.getOwnerComponent().getModel("PermitHistory").setProperty("/permitReferenceNumber", sPermitReference);
					this.appId = sParam1;
					this._getInitialData();
				}

				if (sTab === "Inspectionhistory") {
					this.getOwnerComponent().getModel("PermitHistory").setProperty("/permitReferenceNumber", sInspectionReference);
					oData = {};
					this.permitReferenceNumber = sParam1;
					oData[sName1] = sParam1;
					this._getInspectionHistory(oData);
				}
			}.bind(this));
		},
		clearData: function () {
			this.byId("createBtn").setVisible(false);
			this.byId("alterBtn").setVisible(false);
			this.byId("continueCreateBtn").setVisible(false);
			this.byId("continueAlterBtn").setVisible(false);
			this.byId("registerBtn").setVisible(false);
			this.byId("stopBtn").setVisible(false);
			this.byId("startBtn").setVisible(false);
			this.byId("attachBtn").setVisible(false);
			this.byId("cancelBtn").setVisible(false);
			this.byId("PAABtn").setVisible(false);
			this.byId("extndBtn").setVisible(false);
			this.byId("revertStartBtn").setVisible(false);
			this.byId("revertStopBtn").setVisible(false);
			this.byId("revertJointingBtn").setVisible(false);
			this.byId("completeJointingBtn").setVisible(false);
			this.byId("editBtn").setVisible(true);
		},

		onSelectTab: function (oEvent) {
			var sTab = oEvent.getParameter("item").getKey();
			var oData = {};
			switch (sTab) {
			case "Permitdetails":
				if (this.bUpdatePermitDetails) {
					this._getInitialData();
				}
				break;
			case "Inspectionhistory":
				if (Object.keys(this.getModel("InspectionHistory").getData()).length === 0) {
					if (this.inspectionId) {
						oData.inspectionId = this.inspectionId;
					} else {
						oData.permitReferenceNumber = this.permitReferenceNumber;
					}
					this._getInspectionHistory(oData);
				}
				break;
			case "CommentsAttachments":
				if (Object.keys(this.getModel("CommentsAttachments").getData()).length === 0) {
					this._getCommentsAttachments();
				}
				break;
			case "VersionHistory":
				this.byId("compareBtn").setEnabled(false);
				this.byId("VersionHistoryTable").removeSelections();
				if (Object.keys(this.getModel("VersionHistory").getData()).length === 0) {
					this._getVersionHistory();
				}
				break;
			case "EventLog":
				if (Object.keys(this.getModel("EventHistory").getData()).length === 0) {
					this._getEventHistory();
				}
				if (!this.getModel("EventTypes")) {
					this._getEventTypes();
				}
				break;
			case "RegistrationHistory":
				if (Object.keys(this.getModel("SitesHistory").getData()).length === 0) {
					this._getSitesHistory();
				}
				break;
			case "PendingActivities":
				if (Object.keys(this.getModel("Activities").getData()).length === 0) {
					this._getActivities();
				}
				break;
			}
		},

		createmodel: function () {
			var data = {
				InspectionHistory: []
			};
			var oModel = new JSONModel(data);
			this.getView().setModel(oModel, "PermitHistory");
		},

		_getInitialData: function () {
			BusyIndicator.show(0);
			this.getView().getModel("oModel").setProperty("/isPrivateFault", false);
			this.getView().getModel("oModel").setProperty("/isPrivatePlanned", false);
			this.getView().getModel("oModel").setProperty("/isFaultPermit", false);
			ApiFacade.getInstance().getApplicationdetails(this.appId)
				.then(function (data) {
					BusyIndicator.hide();
					var cloneData = JSON.parse(JSON.stringify(data));
					this.getView().getModel("ExtendPermitModel").setProperty("/data", cloneData);
					this.getView().getModel("PermitJointingModel").setProperty("/applicationId", data.applicationId);
					this.getView().getModel("PermitJointingModel").setProperty("/actualStartDate", data.actualStartDate);
					this.getView().getModel("PermitJointingModel").setProperty("/actualEndDate", data.actualEndDate);
					this.getView().getModel("PermitJointingModel").setProperty("/proposedEndDate", data.proposedEndDate);
					this.getView().getModel("PermitCancelModel").setProperty("/applicationId", data.applicationId);
					this.getView().getModel("PermitRevertModel").setProperty("/applicationId", data.applicationId);

					this.permitReferenceNumber = data.permitReferenceNumber;
					this.appId = data.applicationId;
					if (data.positionOfWorks) {
						data.positionOfWorks = data.positionOfWorks.split(",");
					}
					// Begin Private Fault flag set for Permit history deatils view
					// var isWorkReferenceNumber = evt.getSource().getBindingContext("SearchModel").getObject().workReferenceNumber;
					if (data.workType === "private_planned" || data.workType === "private_immediate") {
						this.getView().getModel("oModel").setProperty("/isPrivateFault", true);
						if (data.workType === "private_planned") {
							this.getView().getModel("oModel").setProperty("/isPrivatePlanned", true);
							if (data.permitReferenceNumber !== null && data.licenseNumber !== null &&data.licenseNumber !== "") {
								data.permitReferenceNumber = data.licenseNumber + " / " + data.permitReferenceNumber;
							} else if (data.permitReferenceNumber === null && data.licenseNumber !== null) {
								data.permitReferenceNumber = data.licenseNumber;
							} 
						}
					}
					// End Private Fault flag set for Permit history deatils view
					if (data.workType === "immediate" || data.workType === "private_immediate") {
						this.getView().getModel("oModel").setProperty("/isFaultPermit", true);
					}
					this.clearData();
					if (data.workType === "private_planned" || data.workType === "private_immediate") {
						this.byId("editBtn").setVisible(false);
					} else {
						this.byId("editBtn").setVisible(true);
					}
					this._getCommentstoHighwayAuthority(data.applicationId);
					var aActions = data.actions;
					if (aActions) {
						aActions.forEach(function (sAction) {
							switch (sAction) {
							case "new-permit":
								if (data.newPhaseApplicationId) {
									this.byId("continueCreateBtn").setVisible(true);
								} else {
									this.byId("createBtn").setVisible(true);
								}
								break;
							case "alteration":
								if (data.draftApplicationId && data.draftAlterationId) {
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
								if (data.newPhaseApplicationId) {
									this.byId("ContinuePAABtn").setVisible(true);
								} else {
									this.byId("PAABtn").setVisible(true);
								}
								break;
							case "add-attachment":
								this.byId("attachBtn").setVisible(true);
								break;
							case "add-comments":
								this.byId("commentsBtn").setVisible(true);
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

					this.getView().getModel("PermitHistory").getData().highwayAuthority.forEach(function (item) {
						//Check for null and undefined value
						if (data.highwayAuthority !==null && data.highwayAuthority !== undefined){
						//End of check for undefined and null value
						if (data.highwayAuthority.toString() === item.swaCode.toString()) {
							data.highwayAuthorityTxt = item.name;
						}
						}
					}.bind(this));

					this.getView().getModel("PermitHistory").getData().primaryContractor.forEach(function (item) {
						if (data.primaryContractorId === item.id) {
							data.primaryContractorTxt = item.name;
						}
					});
					this.getView().getModel("PermitHistory").getData().secondaryContractor.forEach(function (item) {
						if (data.secondaryContractorId === item.id) {
							data.secondaryContractorTxt = item.name;
						}
							
					});
					this.getView().getModel("PermitHistory").getData().otherContractor.forEach(function (item) {
						if (data.otherContractorId === item.id) {
							data.otherContractorTxt = item.name;
						}
					});
					this.getView().getModel("PermitHistory").getData().workIdentifier.forEach(function (item) {
						if (Number(data.worksIdentifier) === item.worksIdentifierId) {
							data.worksIdentifierTxt = item.description;
						}
					});
					this.getView().getModel("PermitHistory").getData().collaborationType.forEach(function (item) {
						if (data.collaborationType === item.value) {
							data.collaborationTypeTxt = item.displayText;
						}
					});
					this.getView().getModel("PermitHistory").getData().workingGroup.forEach(function (item) {
						if (Number(data.workingGroupId) === item.workingGroupId) {
							data.groupName = item.groupName;
						}
					});
					this.getModel("PermitDetails").setData(data);
					this.getOwnerComponent().getModel("PermitHistory").setProperty(
						"/status", data.status);
					this.getModel("VersionHistory").setData({});
					this.getModel("EventHistory").setData({});
					this.getModel("SitesHistory").setData({});
					this.getModel("Activities").setData({});
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_getVersionHistory: function () {
			BusyIndicator.show(0);
			var oCreatePromise = ApiFacade.getInstance().getVersionHistory(this.appId);
			oCreatePromise.then(function (data) {
					this.getView().getModel("VersionHistory").setData(data);
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_getEventHistory: function () {
			BusyIndicator.show(0);
			var oCreatePromise = ApiFacade.getInstance().getEventHistory(this.appId);
			oCreatePromise.then(function (data) {
					this.getView().getModel("EventHistory").setData(data);
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_getEventTypes: function () {
			BusyIndicator.show(0);
			var oCreatePromise = ApiFacade.getInstance().getStaticData("DFT_EVENT");
			oCreatePromise.then(function (data) {
					this.getView().setModel(new JSONModel(data), "EventTypes");
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_getSitesHistory: function () {
			BusyIndicator.show(0);
			var aPromises = [];
			aPromises.push(ApiFacade.getInstance().getSitestHistory(this.appId));
			aPromises.push(ApiFacade.getInstance().getInspectionUnits(this.appId));
			Promise.all(aPromises).then(function (aData) {
					this.getModel("SitesHistory").setData({
						sites: aData[0],
						totalInspections: aData[1].inspectionUnits ? aData[1].inspectionUnits : 0
					});
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_getActivities: function () {
			BusyIndicator.show(0);
			ApiFacade.getInstance().getApplicationActivities(this.appId)
				.then(function (aData) {
					this.getModel("Activities").setData(aData);
					this.getModel("PermitDetails").setProperty("/pendingActivitiesCount", aData.length);
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		onPressClearActivity: function (sId) {
			BusyIndicator.show(0);
			ApiFacade.getInstance().clearApplicationActivity(sId, this.appId)
				.then(function (aData) {
					this._getActivities();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_getInspectionHistory: function (oData) {
			BusyIndicator.show(0);
			var oCreatePromise = ApiFacade.getInstance().InspectionSearch(oData);
			oCreatePromise.then(function (data) {
					this.getModel("InspectionHistory").setData(data);
					if (data.length !== 0) {
						this.appId = data[0].applicationId;
						if (Object.keys(this.getModel("PermitDetails").getData()).length === 0) {
							this._getInitialData();
						} else {
							BusyIndicator.hide();
						}
						data.forEach(function (oItem, index, object) {
							if (oItem.status.length !== 0) {
								oItem.workStatusValue = oItem.status[0].status;
							}
							//Set due date and time from DFT
							if (oItem.dueDate === null || oItem.dueDate === "") {
								var isStartDate = oItem.startDate.split("Z")[0];
								this._getDueDateCalculation(oItem.inspectionType.toLowerCase(), oItem.category.toLowerCase(), oItem.outcome.toLowerCase(),
									isStartDate, index);
							} else {
								this.getModel("InspectionHistory").setProperty("/" + index + "/dueDate", moment(oItem.dueDate).format(
									'DD MMM YYYY HH:mm'));
							}
							this.getModel("InspectionHistory").setProperty("/" + index + "/startDate", moment(oItem.startDate).format(
								'DD MMM YYYY HH:mm'));
						}.bind(this));
						// data[0].workStatusValue = data[0].status[0].status;
					} else if (Object.keys(this.getModel("PermitDetails").getData()).length === 0) {
						this._getInitialData();
					} else {
						BusyIndicator.hide();
					}
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_getCommentsAttachments: function () {
			//TODO
			BusyIndicator.show(0);
			var aPromises = [];
			aPromises.push(ApiFacade.getInstance().getHighwayAuthoritycomments(this.appId));
			aPromises.push(ApiFacade.getInstance().getApplicationFiles(this.appId));
			Promise.all(aPromises)
				.then(function (aData) {
					var oData = {
						comments: {
							internal: [],
							external: []
						},
						attachments: aData[1]
					};
					var oPeriodicities = {};
					aData[0].forEach(function (oComment) {
						if (oComment.commentType === "EXTERNAL") {
							oData.comments.external.push(oComment);
						} else {
							oData.comments.internal.push(oComment);
						}
					});
					this.getModel("CommentsAttachments").setData(oData);
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		//Public Function//
		onHome: function () {
			this.oRouter.navTo("RouteHome", null, true);
		},

		_createModel: function () {
			var oModel = new JSONModel({});
			this.getView().setModel(oModel, "PermitDetails");
		},

		_createEventHistoryModel: function () {
			var oModel = new JSONModel({});
			this.getView().setModel(oModel, "EventHistory");
		},

		_createVersionHistoryModel: function () {
			var oModel = new JSONModel({});
			this.getView().setModel(oModel, "VersionHistory");
		},

		_createSitesHistoryModel: function () {
			var oModel = new JSONModel({});
			this.getView().setModel(oModel, "SitesHistory");
		},

		_createInspectionHistoryModel: function () {
			var oModel = new JSONModel({});
			this.getView().setModel(oModel, "InspectionHistory");
		},

		_createActivitiesModel: function () {
			var oModel = new JSONModel({});
			this.getView().setModel(oModel, "Activities");
		},

		_createCommentsAttachmentsModel: function () {
			var oModel = new JSONModel({});
			this.getView().setModel(oModel, "CommentsAttachments");
		},

		FormatSelectedlocation: function (locationDescription, street, area, town) {
			var selLoc = "";
			//Begin - Exact location with selected location for Permit Details - CR MVP2 - UKPN-2786			
			if (locationDescription !== null && locationDescription !== "" && locationDescription !== undefined) {
				selLoc += locationDescription;
			}
			//End - Exact location with selected location for Permit Details  - CR MVP2 - UKPN-2786
			if (street !== null && street !== "" && street !== undefined) {
				selLoc += ", " + street;
			}
			if (area !== null && area !== "" && area !== undefined) {
				selLoc += ", " + area;
			}
			if (town !== null && town !== "" && town !== undefined) {
				selLoc += ", " + town;
			}
			return selLoc;
		},

		DateFormat: function (date) {
			var dateFormatted;
			if (date !== "" && date !== undefined && date !== null) {
				// var dateFormat =  
				dateFormatted = moment(date).format('DD MMM YYYY');;
			}
			return dateFormatted;
		},

		formatWorkdateRange: function (date1, date2) {
			var dateFormatted1, dateFormatted2;
			if (date1 !== "" && date1 !== undefined && date1 !== null && date2 !== "" && date2 !== undefined && date2 !== null) {
				dateFormatted1 = moment(date1).format('DD MMM YYYY');
				dateFormatted2 = moment(date2).format('DD MMM YYYY');
			}
			return (dateFormatted1 + "-" + dateFormatted2);
		},

		onClickView: function (evt) {
			var sInspectionId = evt.getSource().getBindingContext("InspectionHistory").getObject().inspectionId;
			this.doNavTo("Inspection", {
				state: sInspectionId,
				mode: "inspection-detail"
			});
		},

		onPressCreatePermit: function (bContinue) {
			if (bContinue) {
				var oModel = this.getModel("PermitDetails").getData();
				if (oModel.newPhaseWorkType.toLowerCase() === "immediate") {
					if (oModel.newPhaseWorkType.toLowerCase().indexOf("private") !== -1) {
						this.doNavTo("FaultPrivate", {
							mode: "edit",
							NAME1: "ApplicationId",
							PARAM1: oModel.newPhaseApplicationId
						});
					} else {
						this.doNavTo("FaultPermit", {
							mode: "edit",
							NAME1: "ApplicationId",
							PARAM1: oModel.newPhaseApplicationId
						});
					}
				} else {
					if (oModel.newPhaseWorkType.toLowerCase().indexOf("private") !== -1) {
						this.doNavTo("PlannedPrivate", {
							mode: "edit",
							NAME1: "ApplicationId",
							PARAM1: oModel.newPhaseApplicationId
						});
					} else {
						this.doNavTo("PlannedPermit", {
							mode: "edit",
							NAME1: "ApplicationId",
							PARAM1: oModel.newPhaseApplicationId
						});
					}
				}
			} else {
				if (!this.createPermitDialog) {
					this.createPermitDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.CreatePermit", this);
					this.getView().addDependent(this.createPermitDialog);
				}
				this.setModel(new JSONModel({
					createpermitselectedKey: ""
				}), "SearchModel");
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
			var oModel = this.getView().getModel("PermitDetails").getData();
			if (selectedkey === "CreatePermit") {
				if (oModel.workType.toLowerCase().indexOf("private") !== -1) {
					this.doNavTo("PlannedPrivate", {
						mode: "create",
						NAME1: "PermitReference",
						PARAM1: this.getView().getModel("PermitDetails").getProperty("/permitReferenceNumber")
					});
				} else {
					this.doNavTo("PlannedPermit", {
						mode: "create",
						NAME1: "PermitReference",
						PARAM1: this.getView().getModel("PermitDetails").getProperty("/permitReferenceNumber")
					});
				}
			} else if (selectedkey === "FaultPermit") {
				if (oModel.workType.toLowerCase().indexOf("private") !== -1) {
					this.doNavTo("FaultPrivate", {
						mode: "create",
						NAME1: "PermitReference",
						PARAM1: this.getView().getModel("PermitDetails").getProperty("/permitReferenceNumber")
					});
				} else {
					this.doNavTo("FaultPermit", {
						mode: "create",
						NAME1: "PermitReference",
						PARAM1: this.getView().getModel("PermitDetails").getProperty("/permitReferenceNumber")
					});
				}
			} else {
				MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("CreatePermit_Error"));
			}

		},

		onPressAlterPermit: function (bContinue) {
			var oModel = this.getModel("PermitDetails").getData();
			if (bContinue) {
				if (oModel.draftWorkType.toLowerCase() === "immediate") {
					this.doNavTo("FaultPermit", {
						mode: "AlterPermit",
						NAME1: "ApplicationId",
						PARAM1: oModel.applicationId + "_AlterationId=" + oModel.draftApplicationId + "&" + oModel.draftAlterationId
					});
				} else if (oModel.draftWorkType.toLowerCase() === "planned") {
					this.doNavTo("PlannedPermit", {
						mode: "AlterPermit",
						NAME1: "ApplicationId",
						PARAM1: oModel.applicationId + "_AlterationId=" + oModel.draftApplicationId + "&" + oModel.draftAlterationId
					});
				} else if (oModel.draftWorkType.toLowerCase() === "private_immediate") {
					this.doNavTo("FaultPrivate", {
						mode: "AlterPermit",
						NAME1: "ApplicationId",
						PARAM1: oModel.applicationId + "_AlterationId=" + oModel.draftApplicationId + "&" + oModel.draftAlterationId
					});
				} else if (oModel.draftWorkType.toLowerCase() === "private_planned") {
					this.doNavTo("PlannedPrivate", {
						mode: "AlterPermit",
						NAME1: "ApplicationId",
						PARAM1: oModel.applicationId + "_AlterationId=" + oModel.draftApplicationId + "&" + oModel.draftAlterationId
					});
				}
			} else {
				if (oModel.workType.toLowerCase() === "planned") {
					this.doNavTo("PlannedPermit", {
						mode: "AlterPermit",
						NAME1: "PermitReference",
						PARAM1: this.permitReferenceNumber
					});
				} else if (oModel.workType.toLowerCase() === "immediate") {
					this.doNavTo("FaultPermit", {
						mode: "AlterPermit",
						NAME1: "PermitReference",
						PARAM1: this.permitReferenceNumber
					});
				} else if (oModel.workType.toLowerCase() === "private_immediate") {
					this.doNavTo("FaultPrivate", {
						mode: "AlterPermit",
						NAME1: "PermitReference",
						PARAM1: this.permitReferenceNumber
					});
				} else if (oModel.workType.toLowerCase() === "private_planned") {
					this.doNavTo("PlannedPrivate", {
						mode: "AlterPermit",
						NAME1: "PermitReference",
						PARAM1: this.permitReferenceNumber
					});
				}
			}
		},

		onPressPAA: function (bContinue) {
			var oModel = this.getView().getModel("PermitDetails").getData();
			if (bContinue) {
				this.doNavTo("PlannedPermit", {
					mode: "PAA",
					NAME1: "DraftApplicationId",
					PARAM1: oModel.newPhaseApplicationId
				});
			} else {
				this.doNavTo("PlannedPermit", {
					mode: "PAA",
					NAME1: "PermitReference",
					PARAM1: oModel.permitReferenceNumber
				});
			}
		},

		onPressRegister: function () {
			this.doNavTo("RegisterPermit", {
				state: this.appId
			});
		},

		onPressStartStop: function (startStopPermit) {
			this.startStopPermit = startStopPermit;
			this.setModel(new JSONModel({
				startStopPermit: startStopPermit
			}), "SearchModel");
			if (!this.StartStopPermitDialog) {
				this.StartStopPermitDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.StartStopPermit", this);
				this.getView().addDependent(this.StartStopPermitDialog);
			}
			sap.ui.getCore().byId("idDialogStartPermit").setTitle(startStopPermit + " " + this.getView().getModel("i18n").getResourceBundle()
				.getText(
					"StartstopPermit"));

			if (this.startStopPermit === "Start") {
				var proposedDate = this.getModel("PermitDetails").getProperty("/proposedStartDate");
				var proposedEDate = this.getModel("PermitDetails").getProperty("/proposedEndDate");
				// sap.ui.getCore().byId("idSearchStartdateTime").setMaxDate(new Date());
				// sap.ui.getCore().byId("idSearchStartdateTime").setMaxDate(new Date(proposedEndDate));
				var proposeStartDate = new Date(proposedDate);
				var currentDate = new Date();
				var proposedEndDate = new Date(proposedEDate);
				if (proposeStartDate < currentDate && currentDate < proposedEndDate || proposedEndDate < currentDate) {
					sap.ui.getCore().byId("idSearchStartdateTime").setMinDate(new Date(proposedDate));
					if (proposedEndDate < currentDate) {
						//fix for the start Date time Maximium Value
						var changedt = new Date(proposedEndDate);
						changedt.setHours(23);
						changedt.setMinutes(59);
						changedt.setSeconds(59);
						//End of the change for Maximium Time value 
						sap.ui.getCore().byId("idSearchStartdateTime").setMaxDate(changedt);
					//sap.ui.getCore().byId("idSearchStartdateTime").setMaxDate(new Date(proposedEndDate));
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
				// sap.ui.getCore().byId("idSearchStartdateTime").setInitialFocusedDateValue(new Date());
			} else {
				var actualStartdate = this.getModel("PermitDetails").getProperty("/proposedStartDate");
				sap.ui.getCore().byId("idSearchStartdateTime").setMinDate(new Date(actualStartdate));
				sap.ui.getCore().byId("idSearchStartdateTime").setInitialFocusedDateValue(new Date());
				this.StartStopPermitDialog.open();
			}
			// sap.ui.getCore().byId("idSearchStartdateTime").setDateValue(null);
			// this.StartStopPermitDialog.open();
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
				var appId = this.getModel("PermitDetails").getProperty("/applicationId");
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
						// this.getApplicationSearch();
						this._getInitialData();
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
						this.appId
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
							this.bUpdatePermitDetails = true;
							this._getCommentsAttachments();
							sap.m.MessageToast.show(this.getResourceBundle().getText("attachmentsSaved"));
						}.bind(this)
					)
					.catch(
						function (oReject) {
							//Hide busy application
							BusyIndicator.hide();
							this.standardAjaxErrorDisplay(oReject);
						}.bind(this)
					);
			} else {
				sap.m.MessageToast.show(this.getResourceBundle().getText("noAttachments"));
			}
		},

		onPressEditPermit: function () {
			var sApplicationId = this.getView().getModel("PermitDetails").getProperty("/applicationId");
			if (this.getView().getModel("PermitDetails").getProperty("/workType").toLowerCase() === "planned") {
				this.doNavTo("PlannedPermit", {
					mode: "InternalEdit",
					NAME1: "ApplicationId",
					PARAM1: sApplicationId
				});
			} else if (this.getView().getModel("PermitDetails").getProperty("/workType").toLowerCase() === "immediate") {
				this.doNavTo("FaultPermit", {
					mode: "InternalEdit",
					NAME1: "ApplicationId",
					PARAM1: sApplicationId
				});
			} else if (this.getView().getModel("PermitDetails").getProperty("/workType").toLowerCase() === "private_immediate") {
				this.doNavTo("FaultPrivate", {
					mode: "InternalEdit",
					NAME1: "ApplicationId",
					PARAM1: sApplicationId
				});
			} else if (this.getView().getModel("PermitDetails").getProperty("/workType").toLowerCase() === "private_planned") {
				this.doNavTo("PlannedPrivate", {
					mode: "InternalEdit",
					NAME1: "ApplicationId",
					PARAM1: sApplicationId
				});
			}
		},

		onPressAddComments: function (bInternal) {
			this.setModel(new JSONModel({
				content: "",
				type: bInternal ? "INTERNAL" : "EXTERNAL"
			}), "newCommentModel");
			if (!this.CommentsDialog) {
				this.CommentsDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.AddComments", this);
				this.getView().addDependent(this.CommentsDialog);
			}
			this.CommentsDialog.open();
		},

		onPressCancelAddComment: function () {
			this.CommentsDialog.close();
		},

		onSaveComment: function () {
			var oData = this.getModel("newCommentModel").getData();
			if (oData.content !== "") {
				if (oData.type === "EXTERNAL" && !oData.topic) {
					MessageToast.show(this.getResourceBundle().getText("noTopicMsg"));
				} else {
					ApiFacade.getInstance().CreateInspectionComment(
							this.appId,
							oData
						).then(
							function () {
								this.CommentsDialog.close();
								this.bUpdatePermitDetails = true;
								this._getCommentsAttachments();
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
				}
			} else {
				MessageToast.show(this.getResourceBundle().getText("noCommentMsg"));
			}
		},

		onPressSiteDetail: function (sSiteNum) {
			BusyIndicator.show(0);
			ApiFacade.getInstance().getSiteVersionHistory(this.appId, sSiteNum).then(function (aData) {
					var oHistory = {
						workReferece: aData[0].workReference,
						workLocation: aData[0].workLocation,
						versions: []
					};
					var blastFound = false;
					aData.forEach(function (oVersion) {
						if (blastFound) {
							oVersion.title = this.getResourceBundle().getText("previousReinstatement", this.formatter.DateFormatMoment(new Date(oVersion
								.reinstatementDate)));
						} else {
							oVersion.title = this.getResourceBundle().getText("latestReinstatement", this.formatter.DateFormatMoment(new Date(oVersion.reinstatementDate)));
							blastFound = true;
						}
						if (oVersion.reinstatementCoordinates && this.IsJsonString(oVersion.reinstatementCoordinates)) {
							oVersion.reinstatementCoordinates = JSON.parse(oVersion.reinstatementCoordinates);
						}
						oHistory.versions.push(oVersion);
					}.bind(this));
					this.setModel(new JSONModel(oHistory), "siteHistory");
					if (!this.SiteVersionDialog) {
						this.SiteVersionDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.SiteVersionDetail", this);
						this.getView().addDependent(this.SiteVersionDialog);
					}
					this.SiteVersionDialog.open();
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		onSiteVersionDetailClose: function () {
			this.SiteVersionDialog.close();
		},

		onPressViewCoordinates: function (oGeometry) {
			var sType = oGeometry.type;
			var aCoordinates = oGeometry.coordinates;
			var sDomain = this.getResourceBundle().getText("gsaURL");
			var sUrl = sDomain + "gsaweb/gsa.jsp?src=StreetManager";
			if (sType && aCoordinates) {
				if (!Array.isArray(aCoordinates[0])) {
					aCoordinates = [aCoordinates];
				}
				sUrl += "&geomType=" + sType + "&coordinates=[";
				aCoordinates.forEach(function (oCoords) {
					sUrl += "[" + oCoords.toString() + "]";
				}.bind(this));
				sUrl += "]";
			}
			window.open(sUrl, '_blank');
		},

		onVersionSelect: function (oEvent) {
			if (oEvent.getSource().getSelectedItems().length > 2) {
				oEvent.getParameter("listItem").setSelected(false);
			} else if (oEvent.getSource().getSelectedItems().length == 2) {
				this.byId("compareBtn").setEnabled(true);
			} else {
				this.byId("compareBtn").setEnabled(false);
			}
		},

		onVersionCompare: function () {
			BusyIndicator.show(0);
			var aItems = this.byId("VersionHistoryTable").getSelectedItems();
			var aFinalPromises = [];
			var oAppDetail1, oAppDetail2;
			aItems.forEach(function (oItem) {
				var aPromises = [];
				var sId = this.getModel("VersionHistory").getProperty(oItem.getBindingContextPath()).appId;
				aPromises.push(ApiFacade.getInstance().getApplicationdetails(sId));
				aPromises.push(ApiFacade.getInstance().getHighwayAuthoritycomments(sId));
				aFinalPromises = aFinalPromises.concat(aPromises);
				Promise.all(aPromises)
					.then(function (aData) {
						var data = aData[0],
							aComments = aData[1];
						if (data.positionOfWorks) {
							data.positionOfWorks = data.positionOfWorks.split(",");
						}
						//Changes by Amdhan Team ....Dheeraj Agrawal Date 21-08-2020 For Undefined error 
						if (data.assesmentStatus !== null && data.assesmentStatus !== undefined  ){
						data.assessmentStatus = data.assessmentStatus.toUpperCase();
						}
						else{
							data.assessmentStatus ="" ;
							}							
//End of Code Changes for the undefined error 
						data.CommentstoHighwayAuthority = aComments;
						this.getView().getModel("PermitHistory").getData().highwayAuthority.forEach(function (item) {
							//Check for null and undefined value
							if (data.highwayAuthority !==null && data.highwayAuthority !== undefined){
								// End of Check for null and undefined value
							if (data.highwayAuthority.toString() === item.swaCode.toString()) {
								data.highwayAuthorityTxt = item.name;
							}
							}
						}.bind(this));
						data.primaryContractorTxt = "";
						this.getView().getModel("PermitHistory").getData().primaryContractor.forEach(function (item) {
							if (data.primaryContractorId === item.id) {
								data.primaryContractorTxt = item.name;
							}
						});
						data.secondaryContractorTxt = "";
						this.getView().getModel("PermitHistory").getData().secondaryContractor.forEach(function (item) {
							if (data.secondaryContractorId === item.id) {
								data.secondaryContractorTxt = item.name;
							}
						});
						data.otherContractorTxt = "";
						this.getView().getModel("PermitHistory").getData().otherContractor.forEach(function (item) {
							if (data.otherContractorId === item.id) {
								data.otherContractorTxt = item.name;
							}
						});
						data.worksIdentifierTxt = "";
						this.getView().getModel("PermitHistory").getData().workIdentifier.forEach(function (item) {
							if (Number(data.worksIdentifier) === item.worksIdentifierId) {
								data.worksIdentifierTxt = item.description;
							}
						});
						data.collaborationTypeTxt = "";
						this.getView().getModel("PermitHistory").getData().collaborationType.forEach(function (item) {
							if (data.collaborationType === item.value) {
								data.collaborationTypeTxt = item.displayText;
							}
						});
						if (!oAppDetail1) {
							oAppDetail1 = data;
						} else {
							oAppDetail2 = data;
						}
					}.bind(this))
					.catch(function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this));
			}.bind(this));
			Promise.all(aFinalPromises)
				.then(function (aData) {
					for (var i in oAppDetail1) {
						var bDifferent = false;
						if (typeof oAppDetail1[i] === "object") {
							if (JSON.stringify(oAppDetail1[i]) !== JSON.stringify(oAppDetail2[i])) {
								bDifferent = true;
							}
						} else if (oAppDetail1[i] !== oAppDetail2[i]) {
							bDifferent = true;
						}
						oAppDetail1[i] = {
							value: oAppDetail1[i],
							diff: bDifferent
						};
						oAppDetail2[i] = {
							value: oAppDetail2[i],
							diff: bDifferent
						};
					}
					this.setModel(new JSONModel({
						app1: oAppDetail1,
						app2: oAppDetail2
					}), "compareModel");
					BusyIndicator.hide();
					if (!this.CompareDialog) {
						this.CompareDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.CompareVersions", this);
						this.getView().addDependent(this.CompareDialog);
					}
					this.CompareDialog.open();
				}.bind(this))
				.catch(function (oReject) {
					BusyIndicator.hide();
					this.standardAjaxErrorDisplay(oReject);
				}.bind(this));
		},

		onCompareClose: function () {
			this.CompareDialog.close();
		},

		onPressVersionDetail: function (sAppId) {
			BusyIndicator.show(0);
			ApiFacade.getInstance().getApplicationdetails(sAppId)
				.then(function (data) {
					BusyIndicator.hide();
					//BACKUP REAL PERMIT DETAILS
					this._oldDetails = JSON.parse(JSON.stringify(this.getView().getModel("PermitDetails").getData()));
					this._oldComments = this.getView().getModel("PermitDetails").getProperty("/CommentstoHighwayAuthority") ? JSON.parse(JSON.stringify(
						this.getView().getModel("PermitDetails").getProperty("/CommentstoHighwayAuthority"))) : null;
					this.getView().getModel("PermitDetails").setProperty("/CommentstoHighwayAuthority", null);
					this._oldCommentsTxt = this.getView().getModel("PermitDetails").getProperty("/highwayAuthorityTxt") ? JSON.parse(JSON.stringify(
						this.getView().getModel("PermitDetails").getProperty("/highwayAuthorityTxt"))) : null;
					this.getView().getModel("PermitDetails").setProperty("/highwayAuthorityTxt", null);
					this._getCommentstoHighwayAuthority(data.applicationId);
					if (data.positionOfWorks) {
						data.positionOfWorks = data.positionOfWorks.split(",");
					}
					data.highwayAuthorityTxt = "";
					this.getView().getModel("PermitHistory").getData().highwayAuthority.forEach(function (item) {
						//Check for null and undefined value
						if (data.highwayAuthority !==null && data.highwayAuthority !== undefined){
							//End of Check for null and undefined value
						if (data.highwayAuthority.toString() === item.swaCode.toString()) {
							data.highwayAuthorityTxt = item.name;
						}
						}
					}.bind(this));
					data.primaryContractorTxt = "";
					this.getView().getModel("PermitHistory").getData().primaryContractor.forEach(function (item) {
						if (data.primaryContractorId === item.id) {
							data.primaryContractorTxt = item.name;
						}
					});
					data.secondaryContractorTxt = "";
					this.getView().getModel("PermitHistory").getData().secondaryContractor.forEach(function (item) {
						if (data.secondaryContractorId === item.id) {
							data.secondaryContractorTxt = item.name;
						}
					});
					data.otherContractorTxt = "";
					this.getView().getModel("PermitHistory").getData().otherContractor.forEach(function (item) {
						if (data.otherContractorId === item.id) {
							data.otherContractorTxt = item.name;
						}
					});
					data.worksIdentifierTxt = "";
					this.getView().getModel("PermitHistory").getData().workIdentifier.forEach(function (item) {
						if (Number(data.worksIdentifier) === item.worksIdentifierId) {
							data.worksIdentifierTxt = item.description;
						}
					});
					data.collaborationTypeTxt = "";
					this.getView().getModel("PermitHistory").getData().collaborationType.forEach(function (item) {
						if (data.collaborationType === item.value) {
							data.collaborationTypeTxt = item.displayText;
						}
					});
					this.getView().getModel("PermitHistory").getData().workingGroup.forEach(function (item) {
						if (Number(data.workingGroupId) === item.workingGroupId) {
							data.groupName = item.groupName;
						}
					});					
					this.getView().getModel("PermitDetails").setData(data);
					if (!this.VersionDialog) {
						this.VersionDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.VersionDetail", this);
						this.getView().addDependent(this.VersionDialog);
					}
					this.VersionDialog.open();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		//NOT USED FOR NOW!
		onVersionDetailClose: function () {
			//RESTORE REAL PERMIT DETAILS
			this.getView().getModel("PermitDetails").setData(this._oldDetails);
			this.getView().getModel("PermitDetails").setProperty("/CommentstoHighwayAuthority", this._oldComments);
			this.getView().getModel("PermitDetails").setProperty("/highwayAuthorityTxt", this._oldCommentsTxt);
			this.VersionDialog.close();
		},

		_getPositions: function () {
			BusyIndicator.show();
			var oPromise = ApiFacade.getInstance().getStaticData("locations");
			oPromise.then(function (data) {
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

		//Get Work Categories//
		_getWorkCategories: function (event) {
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

		//Get Assesment Reasons//
		_getAssesmentReasons: function () {
			var oPromise = ApiFacade.getInstance().getStaticData("REASONS_FOR_REFUSAL");
			oPromise.then(function (data) {
				this.setModel(new JSONModel(data), "assesmentReasons");
			}.bind(this))
			.catch(
				function (oReject) {
					this.standardAjaxErrorDisplay(oReject)
				}.bind(this)
			);
			return oPromise;
		},

		//Get Assesment Status//
		_getAssesmentStatus: function () {
			var oPromise = ApiFacade.getInstance().getStaticData("ASSESSMENT_STATUS");
			oPromise.then(function (data) {
				this.setModel(new JSONModel(data), "assesmentStatus");
			}.bind(this))
			.catch(
				function (oReject) {
					this.standardAjaxErrorDisplay(oReject)
				}.bind(this)
			);
			return oPromise;
		},

		//Get Inspection Status//
		_getInspectionStatus: function () {
			var oPromise = ApiFacade.getInstance().getStaticData("INSPECTION_TASK_STATUS");
			oPromise.then(function (data) {
				this.setModel(new JSONModel(data), "inspectionStatus");
			}.bind(this))
			.catch(
				function (oReject) {
					this.standardAjaxErrorDisplay(oReject)
				}.bind(this)
			);
			return oPromise;
		},

		//Get Work Types//
		_getWorkTypes: function () {
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

		_getContractorAll: function () {
			var oCreatePromise = ApiFacade.getInstance().getAllContractors();
			oCreatePromise.then(function (data) {
					BusyIndicator.hide();
					var primaryContractor = data.filter(function (param) {
						return param.primary === true;
					});
					var secondaryContractor = data.filter(function (param) {
						return param.secondary === true;
					});
					var tmContractor = data.filter(function (param) {
						return param.tm === true;
					});
					var otherContractor = data.filter(function (param) {
						return param.other === true;
					});
					this.getView().getModel("PermitHistory").setProperty("/primaryContractor", primaryContractor);
					this.getView().getModel("PermitHistory").setProperty("/secondaryContractor", secondaryContractor);
					this.getView().getModel("PermitHistory").setProperty("/tmContractor", tmContractor);
					this.getView().getModel("PermitHistory").setProperty("/otherContractor", otherContractor);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
			return oCreatePromise;
		},

		_getWorkIdentifier: function () {
			var oCreatePromise = ApiFacade.getInstance().getWorkIdentifier();
			oCreatePromise.then(function (data) {
					this.getView().getModel("PermitHistory").setProperty("/workIdentifier", data);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
			return oCreatePromise;
		},

		_getCollaborationType: function () {
			var oCreatePromise = ApiFacade.getInstance().getCollaborationType();
			oCreatePromise.then(function (data) {
					this.getView().getModel("PermitHistory").setProperty("/collaborationType", data);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
			return oCreatePromise;
		},

		_getCommentstoHighwayAuthority: function (appId) {
			var oCreatePromise = ApiFacade.getInstance().getHighwayAuthoritycomments(appId);
			oCreatePromise.then(function (data) {
					this.getView().getModel("PermitDetails").setProperty("/CommentstoHighwayAuthority", data);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
			return oCreatePromise;
		},
		_getHighwayAuthority: function () {
			var oCreatePromise = ApiFacade.getInstance().getHighwayAuthority();
			oCreatePromise.then(function (data) {
					this.getView().getModel("PermitHistory").setProperty("/highwayAuthority", data);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
			return oCreatePromise;
		},

		_getHighwayAuthorityContacts: function () {
			var oCreatePromise = ApiFacade.getInstance().getAuthorityContact();
			oCreatePromise.then(function (data) {
					this.getView().getModel("PermitHistory").setProperty("/highwayAuthorityContacts", data);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
			return oCreatePromise;
		},

		_getTopics: function () {
			if (!this.getOwnerComponent().getModel("topicsModel")) {
				ApiFacade.getInstance().getStaticData("COMMENT_TOPIC")
					.then(function (data) {
						this.getOwnerComponent().setModel(new JSONModel(data), "topicsModel");
					}.bind(this))
					.catch(
						function (oReject) {
							BusyIndicator.hide();
							var errorMessage = oReject.error.responseText;
							if (typeof errorMessage !== "string") {
								errorMessage = errorMessage.message;
							}
							MessageBox.warning(errorMessage);
						}.bind(this)
					);
			}
		},

		_getDueDateCalculation: function (isInstype, isCategory, isOutcome, isDate, index) {
			if (isInstype !== null && isCategory !== null && isOutcome !== null) {
				var oCreatePromise = ApiFacade.getInstance().getInspectionduedatecalculation(isInstype, isCategory, isOutcome, isDate);
				oCreatePromise.then(function (data) {
						if (data.dueDate !== "N/A") {
							this.getView().getModel("InspectionHistory").setProperty("/" + index + "/dueDate", moment(data.dueDate).format(
								'DD MMM YYYY HH:mm'));
						}
					}.bind(this))
					.catch(
						function (oReject) {
							var errorMessage = oReject.error.responseText;
							if (typeof errorMessage !== "string") {
								errorMessage = errorMessage.message;
							}
							MessageBox.warning(errorMessage);
						}.bind(this)
					);
			}
		},
		
		_getWorkinggroup: function () {
			var oCreatePromise = ApiFacade.getInstance().getWorkingGroup();
			oCreatePromise.then(function (data) {
					this.getView().getModel("PermitHistory").setProperty("/workingGroup", data);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		}		
	});
});
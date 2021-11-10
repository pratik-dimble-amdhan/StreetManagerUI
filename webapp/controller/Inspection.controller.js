sap.ui.define([
	"project1/controller/base/BaseController",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"project1/util/Formatter",
	"sap/m/MessageToast",
	"project1/services/apiFacade",
	"sap/ui/core/BusyIndicator"
], function (BaseController, MessageBox, JSONModel, Formatter, MessageToast, ApiFacade, BusyIndicator) {
	"use strict";

	return BaseController.extend("project1.controller.Inspection", {
		ChangeInspectionStatus: null,
		AddWorksComments: null,
		InspectionSendTousers: [],
		selectedTasktype: null,
		aOldAttachments: [],
		aOldInspectionAttachments: [],
		CreateInspectionfrom: false,
		bContractor: false,
		sUserName: null,
		handleDate: true,
		isEditable: false,
		contractorId: null,
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("Inspection").attachPatternMatched(this.onRoutemacth, this);
		},

		onRoutemacth: function (oEvent) {
			this.getWorkingGroups();
			this._getWorkTypes();
			this._getAllInspectionTaskStatus();
			this._oInterval = setInterval(function () {
				var oModel = this.getOwnerComponent().getModel("UserProfileModel");
				if (oModel && oModel.getData().assignedRoles) {
					this.sUserName = oModel.getData().username;
					if (oModel.getData().assignedRoles.indexOf("CONTRACTOR") !== -1) {
						this.bContractor = true;
						this.contractorId = oModel.getData().userId;
						this.getView().byId("idEditDetails").setVisible(false);
						this.getView().byId("idBtnAddnew").setVisible(false);
					}
					clearInterval(this._oInterval);
				}
			}.bind(this), 1);
			this.getOwnerComponent().setInspectionModel();
			var id = oEvent.getParameter("arguments").state;
			if (isNaN(id)) {
				this.getOwnerComponent().getModel("InsModel").setProperty("/isInspectionId", id);
			} else {
				this.getOwnerComponent().getModel("InsModel").setProperty("/isInspectionId", parseInt(id, 10));
			}

			//clear values
			this.getView().byId("idDuedatetime").setValueState("None");
			this.getView().byId("idDuedatetime").setValue("");
			this.getView().byId("idInput").setValueState("None");
			this.getView().byId("idInspectionCoordinatorCBox").setValueState("None");
			this.byId("idBtnStatus").setVisible(false);
			this.CreateInspectionfrom = false;

			if (oEvent.getParameter("arguments").mode === "manual-inspection-detail") {
				this.CreateInspectionfrom = true;
				this.byId("idBtnStatus").setVisible(true);
			}
			this.getView().byId("idInput").setValue("");
			this.getView().setModel(new JSONModel({
				EditView: false,
				DisplayView: true
			}), "visibleModel");

			this.getView().byId("idEditDetails").setVisible(true);
			this.createmodel();
			this.getInspectionDetails();
			this.getInspectionCoordinator();
		},

		createmodel: function () {
			var data = {
				InspectionId: "",
				InspectionStatus: [],
				InspectionChangeStatus: [],
				SelectedInspectionChangeStatus: "",
				InspectionStatusComment: "",
				InspectionStatusId: "",
				InspectionCoordinator: [],
				InspectionStatusDetail: [],
				ApplicationID: "",
				CommentId: "",
				InspectionWorkComment: ""
			};
			var oModel = new JSONModel(data);
			this.getView().setModel(oModel, "InsDialogModel");
			this.aOldAttachments = [];
			this.setModel(new JSONModel([]), "AttachmentsModel");
		},

		onPressChangeStatus: function (oEvent) {
			this.getInspectionStatus();
			if (!this.ChangeInspectionStatus) {
				this.ChangeInspectionStatus = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.ChangeInspectionStatus", this);
				this.getView().addDependent(this.ChangeInspectionStatus);
			}
			this.ChangeInspectionStatus.open();
			sap.ui.getCore().byId("idChangeStatusCombo").clearSelection();
			sap.ui.getCore().byId("idStatusChangeCommentText").setValue("");
			sap.ui.getCore().byId("idStatusSaveBtn").setEnabled(false);

		},

		onStatusChangeDropdown: function (evt) {
			if (evt.getSource().getSelectedItem() !== null) {
				this.getView().getModel("InsDialogModel").setProperty("/SelectedInspectionChangeStatus", evt.getSource().getSelectedItem().getText());
			} else {
				this.getView().getModel("InsDialogModel").setProperty("/SelectedInspectionChangeStatus", "");
			}
			this.validationfordialog(sap.ui.getCore().byId("idStatusChangeCommentText"));
		},

		onSaveInspectionStatus: function (oEvent) {
			var isInspectionId = this.getOwnerComponent().getModel("InsModel").getProperty("/InspectionId");
			var isStatusId = this.getOwnerComponent().getModel("InsModel").getProperty("/InspectionStatusId");
			var statusArray = this.getOwnerComponent().getModel("InsModel").getProperty("/InspectionStatusDetail");

			var InspectionStatuspayLoad = {
				comments: this.getView().getModel("InsDialogModel").getProperty("/InspectionStatusComment"),
				inspectionId: isInspectionId,
				inspectionStatusId: isStatusId,
				status: this.getView().getModel("InsDialogModel").getProperty("/SelectedInspectionChangeStatus")
			};
			var CSRFToken = this.getOwnerComponent().CSRFToken;

			if (statusArray.status && statusArray.status.toUpperCase() === "UNASSIGNED") {
				$.ajax({
					type: "POST",
					url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/inspections/" + isInspectionId + "/status",
					contentType: "application/json",
					data: JSON.stringify(InspectionStatuspayLoad),
					headers: {
						"x-csrf-token": CSRFToken
					},
					success: function (data) {
						sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("SaveInspectionStatus"));
						this.getView().getModel("InsModel").setProperty("/isStatusId", data.inspectionStatusId);
						this.getView().byId("idInspectionStatusText").setText(data.status);
					}.bind(this),
					error: function (err) {

					}.bind(this)
				});
			} else {
				$.ajax({
					type: "PUT",
					url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/inspections/" + isInspectionId + "/status/" + isStatusId,
					contentType: "application/json",
					data: JSON.stringify(InspectionStatuspayLoad),
					headers: {
						"x-csrf-token": CSRFToken
					},
					success: function (data) {
						sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("SaveInspectionStatus"));
						this.getView().byId("idInspectionStatusText").setText(data.status);
					}.bind(this),
					error: function (err) {

					}.bind(this)
				});
			}
			this.ChangeInspectionStatus.close();
		},
		onPressCancelStatus: function () {
			MessageBox.confirm(
				this.getView().getModel("i18n").getResourceBundle().getText("CancelStatusChange"), {
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction === MessageBox.Action.OK) {
							this.ChangeInspectionStatus.close();
						}
					}.bind(this)
				}
			);
		},

		onAddWorksComment: function () {
			if (!this.AddWorksComments) {
				this.AddWorksComments = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.AddWorkCommentInspection", this);
				this.getView().addDependent(this.AddWorksComments);
			}
			this.AddWorksComments.open();
			sap.ui.getCore().byId("idCommentSaveBtn").setEnabled(false);
		},

		onPressCancelWorkComment: function () {
			MessageBox.confirm(
				this.getView().getModel("i18n").getResourceBundle().getText("CancelWorkComments"), {
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction === MessageBox.Action.OK) {
							sap.ui.getCore().byId("idAddWorkCommentTextarea").setValue("");
							this.AddWorksComments.close();
							if (sap.ui.Device.browser.msie) {
								this.AddWorksComments.destroy();
								delete this.AddWorksComments;
							}
						}
					}.bind(this)
				}
			);
		},

		onSaveWorkComment: function () {
			var sWorkComment = this.getView().getModel("InsDialogModel").getProperty("/InspectionWorkComment").trim();
			if (sWorkComment.length !== 0) {
				var sApplicationID = this.getOwnerComponent().getModel("InsModel").getProperty("/ApplicationID");
				var WorkCommentPayload = {
					content: sWorkComment,
					type: "EXTERNAL"
				};
				var CSRFToken = this.getOwnerComponent().CSRFToken;
				$.ajax({
					type: "POST",
					url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/applications/" + sApplicationID + "/comments",
					contentType: "application/json",
					data: JSON.stringify(WorkCommentPayload),
					headers: {
						"x-csrf-token": CSRFToken
					},
					success: function (data) {
						sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("SaveWorkComments"));
						sap.ui.getCore().byId("idAddWorkCommentTextarea").setValue("");
					}.bind(this),
					error: function (err) {

					}.bind(this)
				});
			}
			this.AddWorksComments.close();

		},

		handleLiveChangeStatusComment: function (evt) {
			this.validationfordialog(evt.getSource());
		},

		handleLiveChangeWorksComment: function (evt) {
			var sWorkComment = evt.getSource().getValue().trim();
			if (sWorkComment.length !== 0) {
				sap.ui.getCore().byId("idCommentSaveBtn").setEnabled(true);
			} else {
				sap.ui.getCore().byId("idCommentSaveBtn").setEnabled(false);
			}
		},
		validationfordialog: function (ctrl) {
			if (sap.ui.getCore().byId("idChangeStatusCombo").getSelectedItem() !== null && ctrl.getValue().length !== 0) {
				sap.ui.getCore().byId("idStatusSaveBtn").setEnabled(true);
			} else {
				sap.ui.getCore().byId("idStatusSaveBtn").setEnabled(false);
			}
		},

		getInspectionDetails: function () {
			BusyIndicator.show(0);
			var token = null;
			var isInspectionId = this.getOwnerComponent().getModel("InsModel").getProperty("/isInspectionId");

			$.ajax({
				type: "GET",
				async: false,
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/inspections/" + isInspectionId,
				contentType: "application/json",
				success: function (data) {
					var InsModel = this.getView().getModel("InsModel");
					this.getView().getModel("InsModel").setData(data);
					// var duration;
					// if (data.workEndDate === null || data.workStartDate === null || data.workEndDate === "" || data.workStartDate === "") {
					// 	duration = "";
					// } else {
					// 	duration = data.workStartDate.substr(0, 11) + " - " + data.workEndDate.substr(0, 11);
					// }
					if (data.secondaryContractorId === null) {
						this.getView().byId("idSecondaryContractor").setEnabled(false);
					} else {
						this.getView().byId("idSecondaryContractor").setEnabled(true);
					}
					if (data.primaryContractorId === null) {
						this.getView().byId("idPrimaryContractor").setEnabled(false);
					} else {
						this.getView().byId("idPrimaryContractor").setEnabled(true);
					}
					// InsModel.setProperty("isInspectionId",);
					InsModel.setProperty("/InspectionId", data.inspectionId);
					// InsModel.setProperty("/duration", duration);
					InsModel.setProperty("/PrimaryContractor", data.primaryContractorId);
					InsModel.setProperty("/SecondaryContractor", data.secondaryContractorId);
					InsModel.setProperty("/ApplicationID", data.applicationId);
					InsModel.setProperty("/workingGroupId", data.workingGroup);
					if (this.getView().getModel("SuggestModel")) {
						this.getView().getModel("SuggestModel").getData().forEach(function (oWorkingGroup) {
							if (oWorkingGroup.workingGroupId === data.workingGroup) {
								this.getView().byId("idInput").setValue(oWorkingGroup.groupName);
								InsModel.setProperty("/workingGroup", oWorkingGroup.groupName);
							}
						}.bind(this));
					}
					//Set due date and time from DFT
					if (data.dueDate === null || data.dueDate === "") {
						// var isStartDate = new Date(data.startDate).toISOString().split("Z")[0];
						var isStartDate = data.startDate.split("Z")[0];
						this._getDueDateCalculation(data.inspectionType.toLowerCase(), data.category.toLowerCase(), data.outcome.toLowerCase(),
							isStartDate);
					}

					data.failureReasons.forEach(function (item, index, object) {
						var sitesData = [];
						if (item.sites === null || item.sites.length === 0) {
							item.failureReason = index + 1 + ". " + item.failureReason + "\n" + "Site: N/A" + "\n " + item.details;
						} else {
							for (var j = 0; j < item.sites.length; j++) {
								if (item.sites[j].site_number === null || item.sites[j].site_number === "") {
									sitesData.push("Site: N/A");
								} else {
									sitesData.push("Site: " + item.sites[j].site_number);
								}
							}
							item.failureReason = index + 1 + ". " + item.failureReason + "\n" + sitesData.join(", ") + "\n " + item.details;
						}
					});
					data.notes.forEach(function (item, index, object) {
						item.createdBy = item.createdBy + " - " + Formatter.DateFormatTime(new Date(item.createDate));
					});
					if (data.status.length !== 0) {
						InsModel.setProperty("/InspectionStatusDetail", data.status[0]);
						InsModel.setProperty("/InspectionStatusId", data.status[0].inspectionStatusId);
						this.getView().byId("idInspectionStatusText").setText(data.status[0].status);
					} else {
						this.getView().byId("idInspectionStatusText").setText("Unassigned");
						InsModel.setProperty("/InspectionStatusDetail", {
							status: "Unassigned"
						});
						InsModel.setProperty("/InspectionStatusId", 1);
					}
					this.getView().getModel("InsModel").refresh(true);
					this._getInspectionAttachments(isInspectionId);
					this._getAllInspectionTasks(isInspectionId);
					if (data.applicationId && data.applicationId !== -1) {
						this.getStreetandAuthority(data.applicationId);
					}
				}.bind(this),
				error: function (error) {
					BusyIndicator.hide();
					var err = JSON.parse(error.responseText);
					sap.m.MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, sap.m.MessageBox.Icon.ERROR);
				},
				beforeSend: function (xhr) {
					xhr.setRequestHeader("X-CSRF-Token", "Fetch");
				},
				complete: function (xhr) {
					token = xhr.getResponseHeader("X-CSRF-Token");
					this.getOwnerComponent().getModel("oModel").setProperty("/CSRFToken", token);
					this.getOwnerComponent().CSRFToken = token;
				}.bind(this)
			});
		},

		onPressPrimaryContractor: function () {
			var primaryContractor = this.getView().getModel("InsModel").getProperty("/PrimaryContractor");
			this._setContractor(primaryContractor);
		},

		onPressSecondaryContractor: function () {
			var secondaryContractor = this.getView().getModel("InsModel").getProperty("/SecondaryContractor");
			this._setContractor(secondaryContractor);
		},

		getInspectionStatus: function () {
			$.ajax({
				type: "GET",
				async: false,
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/static-data/inspection-status",
				contentType: "application/json",
				success: function (data) {
					this.getView().getModel("InsDialogModel").setProperty("/InspectionChangeStatus", data);
					this.getView().getModel("InsDialogModel").refresh(true);
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					sap.m.MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, sap.m.MessageBox.Icon.ERROR);
				}
			});
		},

		//Get Work Types//
		_getWorkTypes: function (event) {
			var oPromise = ApiFacade.getInstance().getStaticData("WORK_TYPE");
			oPromise.then(function (data) {
				this.setModel(new JSONModel(data), "workingTypes");
			}.bind(this))
			.catch(
				function (oReject) {
					this.standardAjaxErrorDisplay(oReject);
				}.bind(this)
			);
			return oPromise;
		},

		getInspectionCoordinator: function () {
			$.ajax({
				type: "GET",
				async: false,
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/inspections/coordinators",
				contentType: "application/json",
				success: function (data) {
					this.setInspectionCoordinator(data);
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					sap.m.MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, sap.m.MessageBox.Icon.ERROR);
				}
			});
		},

		setInspectionCoordinator: function (data) {
			var swaCode = this.getView().getModel("InsModel").getProperty("/swaCode");
			if (swaCode.length === 3) {
				swaCode = "0" + swaCode;
			}
			var oData = null;
			data.forEach(function (param) {
				if (param.swaOrgRef === swaCode) {
					oData = param;
				}
			});
			var uniqueArr = [];
			var filterArr = [];
			data.forEach(function (param) {
				if (uniqueArr.indexOf(param.complianceTeam) === -1) {
					uniqueArr.push(param.complianceTeam);
					filterArr.push(param);
				}
			});
			this.getView().getModel("InsModel").setProperty("/InspectionCoordinator", filterArr);
			this.getView().getModel("InsModel").refresh(true);
			if (oData !== null) {
				this.getView().byId("idInspectionCoordinatorCBox").setSelectedKey(oData.complianceTeam);
			}
		},

		onHome: function () {
			MessageBox.confirm(
				"Do you want to cancel the application? If cancelled all unsaved data lost.", {
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction === MessageBox.Action.OK) {
							this.oRouter.navTo("RouteHome", null, true);
						}
					}.bind(this)
				}
			);
		},
		_setContractor: function (id) {
			var data = this.getView().getModel("SuggestModel").getData();
			for (var i = 0; i < data.length; i++) {
				if (data[i].contractorId === id && data[i].defect === true) {
					this.getView().byId("idInput").setValue(data[i].groupName);
					//	this.getView().getModel("visibleModel").setProperty("/workGroup", data[i].groupName);
					this.getView().getModel("InsModel").setProperty("/workingGroup", data[i].groupName);
					this.getView().getModel("InsModel").setProperty("/workingGroupId", data[i].workingGroupId);
					this.getView().byId("idInput").setValueState("None");
				}
			}
		},

		onSaveandSendDetails: function (oEvent, bFlag) {
			var sendEmailFlag = bFlag;
			var note = this.getView().getModel("InsModel").getProperty("/Notes");
			var workingGroup = this.getView().getModel("InsModel").getProperty("/workingGroupId"),
				inspectionCoordinator = this.getView().byId("idInspectionCoordinatorCBox");

			var dueDate = this.getView().byId("idDuedatetime").getDateValue();
			var comments = "";

			if (note === undefined || note === "") {} else {
				this.saveNoteAPI(note);
			}

			// if (workingGroup === "" || workingGroup.length === 0 || inspectionCoordinator.getSelectedItem() === null) {
			if (!workingGroup || inspectionCoordinator.getSelectedItem() === null || !this.handleDate) {
				// if (workingGroup === "" || workingGroup.length === 0) {
				var msgArr = [];
				if (!workingGroup) {
					// MessageToast.show("Fill mandatory fields");
					msgArr.push("working Group");
					this.getView().byId("idInput").setValueState("Error");
				} else {
					this.getView().byId("idInput").setValueState("None");
				}

				if (inspectionCoordinator.getSelectedItem() === null) {
					MessageToast.show("Please fill all mandatory fields");
					msgArr.push("Inspection Coordinator");
					this.getView().byId("idInspectionCoordinatorCBox").setValueState("Error");
				} else {
					this.getView().byId("idInspectionCoordinatorCBox").setValueState("None");
				}
				if (!this.handleDate) {
					msgArr.push("Due date and time");
				}
				return MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("ErrorselectedDuedateandtime") + " " + msgArr.join());
			} else {
				this.saveheaderdetails(workingGroup, inspectionCoordinator.getSelectedItem().getText(), dueDate, comments, sendEmailFlag);
			}
		},

		saveNoteAPI: function (note) {
			var CSRFToken = this.getView().getModel("oModel").getProperty("/CSRFToken");
			var isInspectionId = this.getView().getModel("InsModel").getProperty("/InspectionId");
			var payload = {
				"note": note
			};
			$.ajax({
				type: "POST",
				async: false,
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/inspections/" + isInspectionId + "/notes",
				contentType: "application/json",
				data: JSON.stringify(payload),
				headers: {
					"x-csrf-token": CSRFToken
				},
				success: function (data) {
					sap.m.MessageToast.show("Note Saved successfully");
					this.addNote(data.note, data.createDate, data.createdBy);
				}.bind(this),
				error: function (err) {

				}.bind(this)
			});
		},

		saveheaderdetails: function (workingGroup, inspectionCoordinator, dueDate, comments,sendEmailFlag) {
			BusyIndicator.show(0);
			var CSRFToken = this.getView().getModel("oModel").getProperty("/CSRFToken");
			var isInspectionId = this.getView().getModel("InsModel").getProperty("/InspectionId");
			// if (dueDate.toString() === "Invalid Date") {
			// dueDate = null;
			// }
			var payload = {
				workingGroup: workingGroup,
				comments: comments,
				inspectionCoordinator: inspectionCoordinator,
				// dueDate: dueDate === null ? "" : new Date(dueDate.getTime() - (dueDate.getTimezoneOffset() * 60000)).toISOString()
				dueDate: dueDate === null ? "" : new Date(dueDate).toISOString()
			};

			$.ajax({
				type: "PUT",
				async: false,
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/inspections/" + isInspectionId + "?sendMail=" + sendEmailFlag,
				contentType: "application/json",
				data: JSON.stringify(payload),
				headers: {
					"x-csrf-token": CSRFToken
				},
				success: function (data) {
					this.getView().getModel("InsModel").setProperty("/inspectionCoordinator", data.inspectionCoordinator);
					this.getView().getModel("InsModel").setProperty("/dueDate", data.dueDate);
					this._updateInspectionAttachments(isInspectionId);
				}.bind(this),
				error: function (err) {
					MessageBox.error(err.status + " - " + this.getView().getModel("i18n").getResourceBundle().getText("SaveheaderdetailsAPIerror"));
					BusyIndicator.hide();
				}.bind(this)
			});
		},

		addNote: function (note, date, user) {
			var newItem = {
				createdBy: user + " - " + Formatter.DateFormatTime(new Date(date)),
				note: note
			};
			this.getView().getModel("InsModel").getData().notes.push(newItem);
			this.getView().getModel("InsModel").refresh(true);
			this.getView().byId("idInternalNotes").setValue("");
		},

		onPressEditDetails: function () {
			var isInspectionId = this.getOwnerComponent().getModel("InsModel").getProperty("/InspectionId");
			if (this.CreateInspectionfrom) {
				this.doNavTo("CreateInspection", {
					state: isInspectionId
				});
			} else {
				this.getView().getModel("SuggestModel").getData().forEach(function (item) {
					if (item.groupName === this.getView().getModel("InsModel").getData().workingGroup) {
						this.getView().getModel("InsModel").setProperty("/workingGroupId", item.workingGroupId);
					}
				}.bind(this));
				this.getView().byId("idInput").setValue(this.getView().getModel("InsModel").getData().workingGroup);
				this.getView().byId("idInspectionCoordinatorCBox").setSelectedKey(this.getView().getModel("InsModel").getData().inspectionCoordinator);
				// this.getView().byId("idDuedatetime").setValue(this.getView().getModel("InsModel").getProperty("/dueDate"))
				// this.getView().byId("idDuedatetime").setDateValue(new Date(this.getView().getModel("InsModel").getProperty("/dueDate")));
				this.getView().byId("idDuedatetime").setDateValue(this.getView().getModel("InsModel").getProperty("/dueDate") ? new Date(this.getView()
					.getModel("InsModel").getProperty("/dueDate")) : null);
				this.getView().getModel("visibleModel").setProperty("/DisplayView", false);
				this.getView().byId("idEditDetails").setVisible(false);
				this.getView().getModel("visibleModel").setProperty("/EditView", true);
				this.byId("idBtnStatus").setVisible(true);

			}
		},

		activatenonEditData: function () {
			this.getView().getModel("visibleModel").setProperty("/DisplayView", true);
			this.getView().byId("idEditDetails").setVisible(true);
			this.getView().getModel("visibleModel").setProperty("/EditView", false);
			this.byId("idBtnStatus").setVisible(false);
		},

		onsuggestionItemSelected: function (evt) {
			//this.getView().getModel("visibleModel").setProperty("/workGroup", evt.getParameter("selectedItem").getText());
			this.getView().getModel("InsModel").setProperty("/workingGroupId", Number(evt.getParameter("selectedItem").getKey()));
		},

		onInspectionCoordinator: function (evt) {
			if (evt.getSource().getSelectedItem() !== null) {
				evt.getSource().setValueState("None");
				// this.getView().getModel("visibleModel").setProperty("/Inspectioncoordinator", evt.getSource().getSelectedItem().getText());
				this.getView().getModel("InsModel").setProperty("/inspectionCoordinator", evt.getSource().getSelectedItem().getText());
			} else {
				evt.getSource().setValueState("Error");
			}
		},

		handleWorkinggroup: function (evt) {
			if (evt.getSource().getValue().trim().length !== 0) {
				evt.getSource().setValueState("None");
			} else {
				this.getView().getModel("InsModel").setProperty("/workingGroupId", "");
				evt.getSource().setValueState("Error");
			}
		},

		onPressAddnewTask: function (sFragmentName) {
			this.getOwnerComponent().setModel(new JSONModel({
				taskType: [],
				Taskcomments: "",
				InsButtons: false,
				DonotsendUpdate: false,
				viewMode: false,
				editMode: false,
				viewUpdate: true,
				ViewUpload: true,
				isContractor: this.bContractor,
				workingGroupId: ""
			}), "InspectionTaskModel");

			this.getTaskType();
			if (!this.InspectionTask) {
				this.InspectionTask = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.InspectionTask", this);
			}
			this.InspectionSendTousers = [];
			this.aOldAttachments = [];
			this.setModel(new JSONModel([]), "AttachmentsModel");
			var oBox = this.byId("idInspectionAddTaskBox");
			oBox.removeAllItems();
			this.byId("idInspectionBtnTask").setVisible(false);
			oBox.addItem(this.InspectionTask);
			this.getView().byId("idInspectionPage").scrollToElement(oBox, 1000);
		},

		getTaskType: function () {
			var oCreatePromise = ApiFacade.getInstance().getInspectionTaskType();
			oCreatePromise.then(function (data) {
					var oData = this.getModel("InspectionTaskModel").getData();
					data.forEach(function (oItem) {
						if (oItem.taskType === oData.taskType) {
							this.selectedTasktype = oItem;
							this.getModel("InspectionTaskModel").setProperty("/taskTypeId", oItem.defaultComment);
						}
					}.bind(this));
					this.getView().getModel("InspectionTaskModel").setProperty("/taskTypeList", data);
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		getWorkingGroups: function () {
			var oCreatePromise = ApiFacade.getInstance().getWorkingGroup();
			oCreatePromise.then(function (data) {
					var model = new JSONModel(data);
					model.setSizeLimit(data.length);
					this.getView().setModel(model, "SuggestModel");
					if (this.getView().getModel("InsModel") && this.getView().getModel("InsModel").getProperty("/workingGroupId")) {
						data.forEach(function (oWorkingGroup) {
							if (oWorkingGroup.workingGroupId === this.getView().getModel("InsModel").getProperty("/workingGroupId")) {
								this.getView().byId("idInput").setValue(oWorkingGroup.groupName);
								this.getView().getModel("InsModel").setProperty("/workingGroup", oWorkingGroup.groupName);
							}
						}.bind(this));
					}
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);

		},

		onselectInspectionTasktype: function (evt) {
			if (evt.getSource().getSelectedItem() !== null) {
				sap.ui.getCore().byId("idInspectionTaskComments").setValue(evt.getSource().getSelectedKey());
				this.getView().getModel("InspectionTaskModel").setProperty("/InsButtons", true);
				this.selectedTasktype = evt.getParameter("selectedItem").getBindingContext("InspectionTaskModel").getObject();
				if (this.selectedTasktype.defaultDurationISO && this.selectedTasktype.defaultDurationISO !== "") {
					var oDate = this.addDateDuration(new Date(), this.selectedTasktype.defaultDurationISO);
					sap.ui.getCore().byId("idInspectionDTP").setDateValue(oDate);
				} else {
					sap.ui.getCore().byId("idInspectionDTP").setValue("");

				}
			}
			this._validInspectionTaskform();
		},

		onCancelInspection: function (evt, Btn) {
			if (Btn === "close") {
				this.byId("idInspectionAddTaskBox").removeAllItems();
				this.byId("idInspectionBtnTask").setVisible(true);
			} else {
				MessageBox.confirm(
					this.getView().getModel("i18n").getResourceBundle().getText("InspectionCancelMsg"), {
						actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
						onClose: function (oAction) {
							if (oAction === MessageBox.Action.OK) {
								this.byId("idInspectionAddTaskBox").removeAllItems();
								this.byId("idInspectionBtnTask").setVisible(true);
							}
						}.bind(this)
					});
			}
		},

		onInspectiontaskdatechange: function (oEvent) {
			var oDTP = oEvent.getSource(),
				sValue = oEvent.getParameter("value"),
				bValid = oEvent.getParameter("valid");

			if (bValid) {
				oDTP.setValueState(sap.ui.core.ValueState.None);
				this._validInspectionTaskform();
			} else {
				oDTP.setValueState(sap.ui.core.ValueState.Error);
				this.getView().getModel("InspectionTaskModel").setProperty("/InsButtons", false);
				this.getView().getModel("InspectionTaskModel").refresh(true);
				MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("selectedDuedateandtime") + " - '" + sValue + "'");
			}
			sap.ui.getCore().byId("idStatusSelect").addStyleClass("taskBox");
		},

		onPressSaveandSend: function () {
			if (sap.ui.getCore().byId("idPermitWorkImpactchkbox").getSelected() === false) {
				MessageBox.confirm(
					this.getView().getModel("i18n").getResourceBundle().getText("InspectionCreateTaskConfirmMSg"), {
						actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
						onClose: function (oAction) {
							if (oAction === MessageBox.Action.OK) {
								this._saveAndSend();
							}
						}.bind(this)
					});
			} else {
				this._saveAndSend();
			}
		},

		_saveAndSend: function () {
			BusyIndicator.show(0);
			this.isEditable = false;
			var isInspectionId = this.getOwnerComponent().getModel("InsModel").getProperty("/InspectionId");
			var taskdeadline = sap.ui.getCore().byId("idInspectionDTP").getDateValue();
			var oModel = this.getModel("InspectionTaskModel").getData();
			var oData = {
				inspectionTaskTypeId: this.selectedTasktype.inspectionTaskTypeId,
				workingGroupId: oModel.workingGroupId,
				sendUpdates: sap.ui.getCore().byId("idPermitWorkImpactchkbox").getSelected() ? false : true,
				taskDeadline: taskdeadline
			};
			if (oModel.editMode) {
				if (sap.ui.getCore().byId("idInspectionAddnewComment").getValue().trim() === "") {
					oData.status = sap.ui.getCore().byId("idStatusSelect").getSelectedItem().getText();
				} else {
					oData.taskComments = sap.ui.getCore().byId("idInspectionAddnewComment").getValue();
					oData.status = sap.ui.getCore().byId("idStatusSelect").getSelectedItem().getText();
				}
				this.isEditable = true;
			} else if (!oModel.editMode) {
				oData.taskComments = sap.ui.getCore().byId("idInspectionTaskComments").getValue();
			} else {
				oData.status = sap.ui.getCore().byId("idStatusSelect").getSelectedItem().getText();
				oData.taskComments = sap.ui.getCore().byId("idInspectionTaskComments").getValue();
			}
			var oInspectionTaskPromise;
			if (oModel.inspectionTaskId && oModel.inspectionTaskId !== "") {
				oInspectionTaskPromise = ApiFacade.getInstance().updateInspectionTask(isInspectionId, oModel.inspectionTaskId, oData);
			} else {
				oInspectionTaskPromise = ApiFacade.getInstance().createInspectionTask(isInspectionId, oData);
			}
			oInspectionTaskPromise.then(function (data) {
					this.updateAttachments(isInspectionId, data.inspectionTaskId);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_updateInspectionAttachments: function (sInspectionId) {
			BusyIndicator.show(0);
			var aItems = this.byId("InspectionAttachmentsEdit").getItems();
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
				var aPromises = [];
				aFormFiles.forEach(function (oFormFile) {
					var oCreatePromise = ApiFacade.getInstance().createInspectionFile(
						oFormFile,
						sInspectionId
					);
					oCreatePromise.then(function (oData) {
						aFinalFiles.push(oData);
					});
					aPromises.push(oCreatePromise);
				}.bind(this));

				Promise.all(aPromises)
					.then(
						function (aResolve) {
							if (this.byId("InspectionAttachmentsEdit")) {
								var aFiles = this.byId("InspectionAttachmentsEdit").getItems();
								aFiles.forEach(function (oFile) {
									oFile.destroy();
								});
								this.byId("InspectionAttachmentsEdit").destroyItems();
							}
							var aFiles2 = this.byId("InspectionAttachmentsView").getItems();
							aFiles2.forEach(function (oFile) {
								oFile.destroy();
							});
							this.byId("InspectionAttachmentsView").destroyItems();
							this.byId("InspectionAttachmentsView").setUploadButtonInvisible(true);
							this._getInspectionAttachments(sInspectionId);
							this._getAllInspectionTasks(sInspectionId);
							this.activatenonEditData();
							BusyIndicator.hide();
						}.bind(this)
					)
					.catch(
						function (oReject) {
							//Hide busy application
							BusyIndicator.hide();
							this._getAllInspectionTasks(sInspectionId);
							this.activatenonEditData();
							this.standardAjaxErrorDisplay(oReject);
						}.bind(this)
					);
			} else {
				this._getAllInspectionTasks(sInspectionId);
				this.activatenonEditData();
				BusyIndicator.hide();
			}
		},

		updateAttachments: function (sInspectionId, sTaskId) {
			var aItems;
			if (sap.ui.getCore().byId("idUploadCollectionEdit")) {
				aItems = sap.ui.getCore().byId("idUploadCollectionEdit").getItems();
			} else {
				aItems = sap.ui.getCore().byId("uploadCollection").getItems();
			}
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
				var aPromises = [];
				aFormFiles.forEach(function (oFormFile) {
					var oCreatePromise = ApiFacade.getInstance().createInspectionTaskFile(
						oFormFile,
						sInspectionId,
						sTaskId
					);
					oCreatePromise.then(function (oData) {
						aFinalFiles.push(oData);
					});
					aPromises.push(oCreatePromise);
				}.bind(this));

				Promise.all(aPromises)
					.then(
						function (aResolve) {
							this.aOldAttachments = aFinalFiles;
							this.getModel("AttachmentsModel").setProperty("/attachments", aFinalFiles);
							if (this.isEditable) {
								this._getInspectionTask(sInspectionId, sTaskId);
							} else {
								this._getAllInspectionTasks(sInspectionId);
							}
							BusyIndicator.hide();
						}.bind(this)
					)
					.catch(
						function (oReject) {
							//Hide busy application
							BusyIndicator.hide();
							if (this.isEditable) {
								this._getInspectionTask(sInspectionId, sTaskId);
							} else {
								this._getAllInspectionTasks(sInspectionId);
							}
							this.standardAjaxErrorDisplay(oReject);
						}.bind(this)
					);
			} else {
				if (this.isEditable) {
					this._getInspectionTask(sInspectionId, sTaskId);
				} else {
					this._getAllInspectionTasks(sInspectionId);
				}

				BusyIndicator.hide();
			}
		},

		onDeleteItemPress: function (oEvent) {
			oEvent.getSource().destroy();
		},

		/**
		 * Fired when the file size is exceed
		 * @return {undefined} Nothing to return
		 */
		onFileSizeExceed: function () {
			MessageToast.show(this.getResourceBundle().getText("fileSizeError"));
		},

		_validInspectionTaskform: function () {
			var InsTasktype = sap.ui.getCore().byId("idInspectionTasktype").getSelectedItem();
			var InsDatepicker = sap.ui.getCore().byId("idInspectionDTP").getDateValue();
			var InsDatepickerVal = sap.ui.getCore().byId("idInspectionDTP").getValue();
			var TaskComment = sap.ui.getCore().byId("idInspectionTaskComments").getValue();
			var workginGroup = sap.ui.getCore().byId("idSendtomultiInput").getSelectedItem();
			if (!workginGroup || !InsTasktype || !InsDatepicker || InsDatepickerVal === "" || !TaskComment || TaskComment === "") {
				this.getView().getModel("InspectionTaskModel").setProperty("/InsButtons", false);
			} else {
				this.getView().getModel("InspectionTaskModel").setProperty("/InsButtons", true);
			}
		},

		_getAllInspectionTasks: function (isInspectionId) {
			BusyIndicator.show(0);
			var oCreatePromise = ApiFacade.getInstance().getAllInspectionTask(isInspectionId);
			oCreatePromise.then(function (data) {
					data.forEach(function(oTask){
						this.getModel("SuggestModel").getData().forEach(function(oWG){
							if(oWG.workingGroupId === oTask.workingGroupId){
								oTask.workingGroupName = oWG.groupName;
							}
						}.bind(this));
					}.bind(this));
					this.getInspectionTaskFiles(data, isInspectionId);
					this.getView().setModel(new JSONModel(data), "InsTasks");
					this.byId("idInspectionAddTaskBox").removeAllItems();
					this.byId("idInspectionBtnTask").setVisible(true);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},
		_getInspectionContractortask: function (isInspectionId, contractorID) {
			BusyIndicator.show(0);
			var oCreatePromise = ApiFacade.getInstance().getInspectionContractorTask(isInspectionId, contractorID);
			oCreatePromise.then(function (data) {
					this.getInspectionTaskFiles(data, isInspectionId);
					this.getView().setModel(new JSONModel(data), "InsTasks");
					this.byId("idInspectionAddTaskBox").removeAllItems();
					// this.byId("idInspectionBtnTask").setVisible(true);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_getInspectionTask: function (isInspectionId, taskId) {
			BusyIndicator.show(0);
			var oCreatePromise = ApiFacade.getInstance().getInspectionTask(isInspectionId, taskId);
			oCreatePromise.then(function (data) {
					this.getModel("SuggestModel").getData().forEach(function(oWG){
						if(oWG.workingGroupId === data.workingGroupId){
							data.workingGroupName = oWG.groupName;
						}
					}.bind(this));
					var arr = [];
					arr.push(data);
					this.getInspectionTaskFiles(arr, isInspectionId);
					this.getView().getModel("InsTasks").setProperty(this.index, data);
					this.byId("idInspectionAddTaskBox").removeAllItems();
					this.byId("idInspectionBtnTask").setVisible(true);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						var errorMessage = oReject.error.responseJSON.message;
						if (typeof errorMessage !== "string") {
							errorMessage = errorMessage.message;
						}
						MessageBox.warning(errorMessage);
					}.bind(this)
				);
		},

		_getAllInspectionTaskStatus: function () {
			var oCreatePromise = ApiFacade.getInstance().getInspectionTaskStatus();
			oCreatePromise.then(function (data) {
				this.setModel(new JSONModel(data), "inspectionStatus");
				if(this.getModel("InspectionTaskModel")){
					//REMOVING OPTIONS IN CASE OF CONTRACTOR EDIT FEE AGREEMENT
					var oModel = this.getModel("InspectionTaskModel").getData();
					if (this.getModel("InspectionTaskModel") && this.bContractor && oModel.editMode && oModel.taskType === "Fee Agreement") {
						var aFinalStatus = [];
						data.forEach(function (oStatus) {
							if ((this.tableRow.status && oStatus.key === this.tableRow.status.split(" ").join("_").toUpperCase()) || oStatus.key ===
								"FEE_AGREED" || oStatus.key === "FEE_DECLINED") {
								aFinalStatus.push(oStatus);
							}
						}.bind(this));
						this.getView().getModel("InspectionTaskModel").setProperty("/TaskStatus", aFinalStatus);
					} else {
						this.getView().getModel("InspectionTaskModel").setProperty("/TaskStatus", data);
					}
					if (this.tableRow.status !== null) {
						sap.ui.getCore().byId("idStatusSelect").setSelectedKey(this.tableRow.status.split(" ").join("_").toUpperCase());
					} else {
						sap.ui.getCore().byId("idStatusSelect").setSelectedKey(null);
					}
				}
			}.bind(this))
			.catch(
				function (oReject) {
					this.standardAjaxErrorDisplay(oReject);
				}.bind(this)
			);
		},

		onInpectiontasksTablerowselected: function (evt) {
			this.tableRow = JSON.parse(JSON.stringify(evt.getParameter("listItem").getBindingContext("InsTasks").getObject()));
			this.index = evt.getParameter("listItem").getBindingContext("InsTasks").getPath();
			this.tableRow.taskComments.forEach(function (item, index, object) {
				item.createdBy = item.createdBy + "\r\n" + Formatter.DateFormatTime(new Date(item.createDate)) + "\r\n" + item.comment;
			});

			this.getOwnerComponent().setModel(new JSONModel({
				inspectionTaskId: this.tableRow.inspectionTaskId,
				taskType: this.tableRow.taskType,
				taskDeadline: new Date(this.tableRow.taskDeadline),
				workingGroupId: this.tableRow.workingGroupId,
				workingGroupName: this.tableRow.workingGroupName,
				taskComments: this.tableRow.taskComments,
				DonotsendUpdate: !this.tableRow.sendUpdates,
				Taskcomments: this.tableRow.Taskcomments,
				status: this.tableRow.status,
				InsButtons: false,
				viewMode: true,
				editMode: false,
				viewUpdate: false,
				ViewUpload: false,
				isContractor: this.bContractor,
				editable: true
			}), "InspectionTaskModel");

			this._getAllInspectionTaskStatus();

			if (!this.InspectionTask) {
				this.InspectionTask = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.InspectionTask", this);
			}
			if (this.tableRow.status && this.tableRow.status.toUpperCase() !== "OPEN" && !this.bContractor) {
				this.getView().getModel("InspectionTaskModel").setProperty("/editable", false);
			}

			var oBox = this.byId("idInspectionAddTaskBox");
			oBox.removeAllItems();
			this.byId("idInspectionBtnTask").setVisible(false);
			oBox.addItem(this.InspectionTask);
			this.getView().byId("idInspectionPage").scrollToElement(oBox, 1000);
			this.replaceInspectionTaskAttachments(this.tableRow.inspectionTaskId);
		},

		onPressEditInspectionTask: function () {
			var oData = this.getModel("InspectionTaskModel").getData();
			oData.viewMode = false;
			oData.InsButtons = true;
			oData.editMode = true;
			oData.viewUpdate = true;
			oData.ViewUpload = true;
			oData.TaskNewcomments = "";
			this.getTaskType();
			this._getAllInspectionTaskStatus();
			if (!this.InspectionTask) {
				this.InspectionTask = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.InspectionTask", this);
			}
			var oBox = this.byId("idInspectionAddTaskBox");
			oBox.removeAllItems();
			this.byId("idInspectionBtnTask").setVisible(false);
			oBox.addItem(this.InspectionTask);
			sap.ui.getCore().byId("idInspectionTaskComments").setValue(oData.taskComments);
			sap.ui.getCore().byId("idInspectionDTP").setDateValue(oData.taskDeadline);
			this.getView().byId("idInspectionPage").scrollToElement(oBox, 1000);
		},

		_getInspectionAttachments: function (isInspectionId) {
			BusyIndicator.show(0);
			ApiFacade.getInstance().getInspectionFiles(isInspectionId)
				.then(
					function (aFiles) {
						this.aOldInspectionAttachments = aFiles;
						this.setModel(new JSONModel(aFiles), "InspectionAttachmentsModel");
						BusyIndicator.hide();
					}.bind(this)
				)
				.catch(
					function (oReject) {
						//Hide busy application
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		getInspectionTaskFiles: function (aTasks, inspectionId) {
			BusyIndicator.show(0);
			var aPromises = [];
			aTasks.forEach(function (task) {
				var oPromise = ApiFacade.getInstance().getInspectionTaskFile(task, inspectionId);
				oPromise.then(function (oData) {
					if (oData.files.length > 0) {
						this.aOldAttachments[oData.inspectionTaskId] = oData.files;
					}
					BusyIndicator.hide();
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
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);

		},

		replaceInspectionTaskAttachments: function (inspectionTaskId) {
			if (this.aOldAttachments[inspectionTaskId] === undefined) {
				this.aOldAttachments[inspectionTaskId] = [];
			}
			if (sap.ui.getCore().byId("idUploadCollectionEdit")) {
				var aFiles = sap.ui.getCore().byId("idUploadCollectionEdit").getItems();
				aFiles.forEach(function (oFile) {
					oFile.destroy();
				});
				sap.ui.getCore().byId("idUploadCollectionEdit").destroyItems();
			}
			var aFiles2 = sap.ui.getCore().byId("idUploadCollectionDisplay").getItems();
			aFiles2.forEach(function (oFile) {
				oFile.destroy();
			});
			sap.ui.getCore().byId("idUploadCollectionDisplay").destroyItems();
			sap.ui.getCore().byId("idUploadCollectionDisplay").setUploadButtonInvisible(true);
			this.setModel(new JSONModel({
				attachments: this.aOldAttachments[inspectionTaskId]
			}), "AttachmentsModel");
		},

		handleDateChange: function (oEvent) {
			var oDTP = oEvent.getSource(),
				sValue = oEvent.getParameter("value"),
				bValid = oEvent.getParameter("valid");

			if (bValid) {
				oDTP.setValueState(sap.ui.core.ValueState.None);
				this.handleDate = true;
			} else {
				oDTP.setValueState(sap.ui.core.ValueState.Error);
				this.handleDate = false;
				// sValue = sValue.bold();
				MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("selectedDuedateandtime") + " - '" + sValue + "'");
			}
		},

		_getDueDateCalculation: function (isInstype, isCategory, isOutcome, isDate) {
			if (isInstype !== null && isCategory !== null && isOutcome !== null) {
				var oCreatePromise = ApiFacade.getInstance().getInspectionduedatecalculation(isInstype, isCategory, isOutcome, isDate);
				oCreatePromise.then(function (data) {
						if (data.dueDate !== "N/A") {
							this.getView().getModel("InsModel").setProperty("/dueDate", new Date(data.dueDate).toISOString());
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

		getStreetandAuthority: function (applicationId) {
			var oCreatePromise = ApiFacade.getInstance().getApplicationdetails(applicationId);
			oCreatePromise.then(function (data) {
					var str = "";
					if (data.street) {
						str += data.street;
					}
					if (data.area) {
						str += ", " + data.area;
					}
					if (data.town) {
						str += ", " + data.town;
					}
					this.getView().getModel("InsModel").setProperty("/street", str);
					this._getHighwayAuthority(data.highwayAuthority);
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
		},

		_getHighwayAuthority: function (highwayAuthority) {
			var oCreatePromise = ApiFacade.getInstance().getHighwayAuthority();
			oCreatePromise.then(function (data) {
					data.forEach(function (item) {
						if (highwayAuthority === item.swaCode) {
							this.getView().getModel("InsModel").setProperty("/Authority", item.name);
							this.getView().getModel("InsModel").refresh(true);
						}
					}.bind(this));
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
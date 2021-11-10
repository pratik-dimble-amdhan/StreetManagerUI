sap.ui.define([],
	function () {
		return {

			formatPermitcondition: function (No) {
				if (No === 0) {
					return "None";
				}
				return No;
			},

			DateFormat: function (date) {
				var dateFormatted;
				if (date !== "" && date !== undefined && date !== null) {
					var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
						pattern: "d MMM y, HH:mm:ss"
					});
					dateFormatted = dateFormat.format(new Date(date));
				}
				return dateFormatted;
			},

			DateFormatwithoutTime: function (date) {
				var dateFormatted;
				if (date !== "" && date !== undefined && date !== null) {
					var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
						pattern: "d MMM y"
					});
					dateFormatted = dateFormat.format(new Date(date));
				}
				return dateFormatted;
			},
			DateFormatTime: function (date) {
				var dateFormatted;
				if (date !== "" && date !== undefined && date !== null) {
					var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
						pattern: "d MMM y HH:mm"
					});
					dateFormatted = dateFormat.format(new Date(date));
				}
				return dateFormatted;
			},

			DateFormatSearchwithoutTime: function (date1, date2) {
				var dateFormatted1, dateFormatted2;
				if (date1 !== "" && date1 !== undefined && date1 !== null && date2 !== "" && date2 !== undefined && date2 !== null) {
					// var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					// 	pattern: "d MMM y"
					// });
					dateFormatted1 = moment(date1).format('DD MMM YYYY');
					dateFormatted2 = moment(date2).format('DD MMM YYYY');
				}
				return (dateFormatted1 + "-" + dateFormatted2);
			},

			checkDevUrl: function (sHost) {
				sHost = sHost.toUpperCase();
				if (sHost.indexOf("@") !== -1 || sHost === "DEV" || sHost === "QA") {
					return true;
				}
				return false;
			},

			checkNonDevUrl: function (sHost) {
				sHost = sHost.toUpperCase();
				if (sHost.indexOf("@") !== -1 || sHost === "DEV" || sHost === "QA") {
					return false;
				}
				return true;
			},

			checkRoles: function (sRole1, sRole2, sRole3, sRole4) {
				var aRoles = [];
				if (sRole1) {
					aRoles.push(sRole1);
				}
				if (sRole2) {
					aRoles.push(sRole2);
				}
				if (sRole3) {
					aRoles.push(sRole3);
				}
				if (sRole4) {
					aRoles.push(sRole4);
				}
				var sUserRoles = this.getOwnerComponent().getModel("UserProfileModel").getProperty("/visibilityRoles");
				var sEnv = this.getModel("i18n").getResourceBundle().getText("environment").toLowerCase();
				var bGranted = false;
				aRoles.forEach(function (sRole) {
					if (sUserRoles && sUserRoles.indexOf(sRole + "-" + sEnv) !== -1) {
						bGranted = true;
					}
				}.bind(this));
				return bGranted;
			},

			formatDateToGMT: function (dDate) {
				if (dDate instanceof Date) {
					return new Date(dDate.getTime() + (dDate.getTimezoneOffset() * 60 * 1000));
				}
				return new Date(new Date(dDate).getTime() + (new Date(dDate).getTimezoneOffset() * 60 * 1000));
			},

			formatDateFromGMT: function (oDate) {
				if (oDate instanceof Date) {
					return new Date(oDate.getTime() - (oDate.getTimezoneOffset() * 60 * 1000));
				}
				return new Date(new Date(oDate).getTime() - (new Date(oDate).getTimezoneOffset() * 60 * 1000));
			},

			DateFormatMoment: function (date) {
				var dateFormatted;
				if (date !== "" && date !== undefined && date !== null) {
					dateFormatted = moment(date).format('DD MMM YYYY HH:mm:ss');
					// dateFormatted = dateFormat.format(new Date(date));
				}
				return dateFormatted;
			},

			formatEventType: function (sEvent, aEvents) {
				var sEventName = sEvent;
				aEvents.forEach(function (oEvent) {
					if (oEvent.key === sEvent) {
						sEventName = oEvent.displayText;
					}
				}.bind(this));
				return sEventName;
			},

			formatWorkingGroup: function (sId, agroups) {
				var sGroup = sGroup && sGroup !== "" ? sId : "--";
				agroups.forEach(function (oWorkingGroup) {
					if (oWorkingGroup.workingGroupId === sId) {
						sGroup = oWorkingGroup.groupName;
					}
				}.bind(this));
				return sGroup;
			},

			formatTitle: function (workReferenceNumber, appId, licencenumber) {
				var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
				var title;
				if (workReferenceNumber && !licencenumber) {
					title = resourceBundle.getText("private_planned") + " - " + workReferenceNumber;
				} else if (appId && !workReferenceNumber && !licencenumber) {
					title = resourceBundle.getText("private_planned") + " - " + this.getView().getModel("oModel").getProperty("/isApplicationId/workId");
				} else if (workReferenceNumber && licencenumber) {
					title = resourceBundle.getText("private_planned") + " - " + workReferenceNumber + " / " + licencenumber;
				} else {
					title = resourceBundle.getText("private_planned");
				}
				return title;
			},

			publicPlannedPemitTitle: function (workStatus, workReferenceNumber, appId, permitMode) {
				var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
				var title;
				if (workStatus && workReferenceNumber) {
					title = permitMode + " " + resourceBundle.getText("PlannedPermitApplication") + " - " + workReferenceNumber;
				} else if (appId) {
					title = permitMode + " " + resourceBundle.getText("PlannedPermitApplication") + " - " + (typeof (appId) === "object" ? appId.workId :
						appId);
				} else {
					title = permitMode + " " + resourceBundle.getText("PlannedPermitApplication");
				}
				return title;
			},

			publicFaultPemitTitle: function (workStatus, workReferenceNumber, appId, permitMode) {
				var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
				var title;
				if (workStatus && workReferenceNumber) {
					title = permitMode + " " + resourceBundle.getText("ImmediatePermit") + " - " +
						workReferenceNumber;
				} else if (appId) {
					title = permitMode + " " + resourceBundle.getText("ImmediatePermit") + " - " + (
						typeof (appId) === "object" ? appId.workId : appId);
				} else {
					title = permitMode + " " + resourceBundle.getText("ImmediatePermit");
				}
				return title;
			},

			setEastings: function (coordinates, wholeroad) {
				var message;
				if (wholeroad) {
					message = this.getView().getModel("i18n").getResourceBundle().getText("wholeRoad");
				} else {
					var eastingsData = [];
					var geodata = JSON.parse(coordinates);
					switch (geodata.type) {
					case "Point":
						eastingsData.push(geodata.coordinates[0]);
						break;
					case "LineString":
						geodata.coordinates.forEach(function (item) {
							eastingsData.push(item[0]);
						});
						break;
					case "Polygon":
						geodata.coordinates.forEach(function (item) {
							item.forEach(function (subItem) {
								eastingsData.push(subItem[0]);
							});
						});
						break;
					}
					return eastingsData.join("\n");
				}
				return message;
			},

			setNorthings: function (coordinates, wholeroad) {
				var message;
				if (wholeroad) {
					message = this.getView().getModel("i18n").getResourceBundle().getText("wholeRoad");
				} else {
					var northingsData = [];
					var geodata = JSON.parse(coordinates);
					switch (geodata.type) {
					case "Point":
						northingsData.push(geodata.coordinates[1]);
						break;
					case "LineString":
						geodata.coordinates.forEach(function (item) {
							northingsData.push(item[1]);
						});
						break;
					case "Polygon":
						geodata.coordinates.forEach(function (item) {
							item.forEach(function (subItem) {
								northingsData.push(subItem[1]);
							});
						});
						break;
					}
					return northingsData.join("\n");
				}
				return message;
			},

			setStartEndTime: function (timeStartEnd) {
				var timeFormatted;
				if (timeStartEnd !== "" && timeStartEnd !== null && timeStartEnd !== 0) {
					timeStartEnd = JSON.stringify(timeStartEnd);
					if (timeStartEnd.length === 3) {
						timeStartEnd = 0 + timeStartEnd;
					}
					timeFormatted = timeStartEnd.split("")[0] + timeStartEnd.split("")[1] + ":" + timeStartEnd.split("")[2] + timeStartEnd.split("")[3];
				} else {
					timeFormatted = "N/A";
				}
				return timeFormatted;
			},

			DateFormatMomentwithoutTime: function (date) {
				var dateFormatted;
				if (date !== "" && date !== undefined && date !== null) {
					dateFormatted = moment(date).format('DD MMM YYYY');
					// dateFormatted = dateFormat.format(new Date(date));
				}
				return dateFormatted;
			},

			formatDateLimits: function (oDate) {
				if (oDate) {
					if (typeof oData === "object") {
						return oDate;
					} else {
						return new Date(oDate);
					}
				} else {
					return new Date();
				}
			},

			VersionProposeDate: function (pdate, requesttype) {
				var dateFormatted;
				if (pdate !== "" && pdate !== undefined && pdate !== null) {
					if (requesttype === "planned" || requesttype === "private_planned") {
						dateFormatted = moment(pdate).format('DD MMM YYYY');
					} else {
						dateFormatted = moment(pdate).format('DD MMM YYYY HH:mm:ss');
					}
				}
				return dateFormatted;
			},

			overDueDate: function(sDate){
				return new Date(sDate).getTime() < new Date().getTime();
			},
			
			calculateWorkDescLimit: function(){
				var sLength = 500;
				var oModel = this.getModel("oModel").getData();
				//PLANNED PERMITS
				if(this.byId("idPermitDepartmentidentifier") &&
				this.byId("idPermitDepartmentidentifier").getSelectedItem()){
					sLength -= (this.byId("idPermitDepartmentidentifier").getSelectedItem().getText() + ": ").length;
				}else if(oModel.ApplicationDetails.departmentIdentifier && oModel.departmentIdentifier){
					oModel.departmentIdentifier.forEach(function(oDepartment){
						if(oDepartment.departmentId === oModel.ApplicationDetails.departmentIdentifier){
							sLength -= (oDepartment.name + ": ").length;
						}
					}.bind(this));
				}
				if(this.byId("idPemitworkIdentifier") &&
				this.byId("idPemitworkIdentifier").getSelectedItem()){
					sLength -= (this.byId("idPemitworkIdentifier").getSelectedItem().getText() + ": ").length;
				}else if(oModel.ApplicationDetails.worksIdentifier && oModel.SelectedworkIdentifier){
					oModel.SelectedworkIdentifier.forEach(function(oWork){
						if(oWork.worksIdentifierId === oModel.ApplicationDetails.worksIdentifier){
							sLength -= (oWork.description + ": ").length;
						}
					}.bind(this));
				}
				//FAULT PERMITS
				if(this.byId("idWorkIdentifier") && 
				this.byId("idWorkIdentifier").getSelectedItem()){
					sLength -= (this.byId("idWorkIdentifier").getSelectedItem().getText() + ": ").length;
					//REMOVE DEFAULT DEPARTMENT LENGTH
					sLength -= 27;
				}else if(oModel.ApplicationDetails.worksIdentifier && oModel.workIdentifier){
					oModel.workIdentifier.forEach(function(oWork){
						if(oWork.worksIdentifierId === oModel.ApplicationDetails.worksIdentifier){
							sLength -= (oWork.description + ": ").length;
						}
					}.bind(this));
					//REMOVE DEFAULT DEPARTMENT LENGTH
					sLength -= 27;
				}
				var sValue = this.byId("idWorksDescription").getValue();
				if(sValue.length > sLength){
					this.byId("idWorksDescription").setValue(sValue.slice(0, sLength));
				}
				return sLength
			},

			calculateWorkDescLimitText: function(){
				var sLength = 500;
				var oModel = this.getModel("oModel").getData();
				//PLANNED PERMITS
				if(this.byId("idPermitDepartmentidentifier") &&
				this.byId("idPermitDepartmentidentifier").getSelectedItem()){
					sLength -= (this.byId("idPermitDepartmentidentifier").getSelectedItem().getText() + ": ").length;
				}else if(oModel.ApplicationDetails.departmentIdentifier && oModel.departmentIdentifier){
					oModel.departmentIdentifier.forEach(function(oDepartment){
						if(oDepartment.departmentId === oModel.ApplicationDetails.departmentIdentifier){
							sLength -= (oDepartment.name + ": ").length;
						}
					}.bind(this));
				}
				if(this.byId("idPemitworkIdentifier") &&
				this.byId("idPemitworkIdentifier").getSelectedItem()){
					sLength -= (this.byId("idPemitworkIdentifier").getSelectedItem().getText() + ": ").length;
				}else if(oModel.ApplicationDetails.worksIdentifier && oModel.SelectedworkIdentifier){
					oModel.SelectedworkIdentifier.forEach(function(oWork){
						if(oWork.worksIdentifierId === oModel.ApplicationDetails.worksIdentifier){
							sLength -= (oWork.description + ": ").length;
						}
					}.bind(this));
				}
				//FAULT PERMITS
				if(this.byId("idWorkIdentifier") && 
				this.byId("idWorkIdentifier").getSelectedItem()){
					sLength -= (this.byId("idWorkIdentifier").getSelectedItem().getText() + ": ").length;
					//REMOVE DEFAULT DEPARTMENT LENGTH
					sLength -= 27;
				}else if(oModel.ApplicationDetails.worksIdentifier && oModel.workIdentifier){
					oModel.workIdentifier.forEach(function(oWork){
						if(oWork.worksIdentifierId === oModel.ApplicationDetails.worksIdentifier){
							sLength -= (oWork.description + ": ").length;
						}
					}.bind(this));
					//REMOVE DEFAULT DEPARTMENT LENGTH
					sLength -= 27;
				}
				return this.getResourceBundle().getText("MaximumCharacters",[sLength]);
			},

			formatReinstatementStatus: function(sValue){
				if(this.getModel("registerTypes")){
					var aData = this.getModel("registerTypes").getData();
					var sDesc = sValue;
					aData.forEach(function(oData){
						if(oData.value && sValue && oData.value.toUpperCase() === sValue.toUpperCase()){
							sDesc = oData.displayText;
						}
					}.bind(this));
					return sDesc;
				}else{
					return sValue;
				}
			},

			formatPosition: function(sValue){
				if(this.getModel("positions")){
					var aData = this.getModel("positions").getData();
					var sDesc = sValue;
					aData.forEach(function(oData){
						if(oData.value && sValue && oData.value.toUpperCase() === sValue.toUpperCase()){
							sDesc = oData.displayText;
						}
					}.bind(this));
					return sDesc;
				}else{
					return sValue;
				}
			},

			formatWorkType: function(sValue){
				if(this.getModel("workingTypes")){
					var aData = this.getModel("workingTypes").getData();
					var sDesc = sValue;
					aData.forEach(function(oData){
						if(oData.value && sValue && oData.value.toUpperCase() === sValue.toUpperCase()){
							sDesc = oData.displayText;
						}
					}.bind(this));
					return sDesc;
				}else{
					return sValue;
				}
			},

			formatWorkCategory: function(sValue){
				if(this.getModel("workCategories")){
					var aData = this.getModel("workCategories").getData();
					var sDesc = sValue;
					aData.forEach(function(oData){
						if(oData.value && sValue && oData.value.toUpperCase() === sValue.toUpperCase()){
							sDesc = oData.displayText;
						}
					}.bind(this));
					return sDesc;
				}else{
					return sValue;
				}
			},

			formatInspectionStatus: function(sValue){
				if(this.getModel("inspectionStatus")){
					var aData = this.getModel("inspectionStatus").getData();
					var sDesc = sValue;
					aData.forEach(function(oData){
						if(oData.value && sValue && oData.value.toUpperCase() === sValue.toUpperCase()){
							sDesc = oData.displayText;
						}
					}.bind(this));
					return sDesc;
				}else{
					return sValue;
				}
			},

			formatAssesmentStatus: function(sValue){
				if(sValue){
				if(this.getModel("assesmentStatus")){
					var aData = this.getModel("assesmentStatus").getData();
					var sDesc = sValue;
					aData.forEach(function(oData){
						if(oData.value && sValue && oData.value.toUpperCase() === sValue.toUpperCase()){
							sDesc = oData.displayText;
						}
					}.bind(this));
					return sDesc;
				}else{
					return sValue;
				}
				}
				else{
					return "";
				}
			},

			parseRefusalReasons: function(sReasons){
				var sReturn = "";
				if(sReasons){
				var aReasons = sReasons.split(",");
					aReasons.forEach(function(sReason){
						if(this.getModel("assesmentReasons")){
							var aData = this.getModel("assesmentReasons").getData();
							aData.forEach(function(oData){
								if(oData.value && sReason && oData.value.toUpperCase() === sReason.toUpperCase()){
									sReason = oData.displayText;
								}
							}.bind(this));
						}
						if(sReturn === ""){
							sReturn = sReason;
						}else{
							sReturn += "\n" + sReason;
						}
					}.bind(this));
					return sReturn;
				}else{
					return "";
				}
			}
		};
	});
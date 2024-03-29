// Read & send data from NetworkTable.

var RobotCom = false;
var fmsAtt = false;
var robotMode = -1;

// For the robot mode status in the top.
function updateModeStat() {
  var out = "";
  var classSet = "badge badge-pill ";
  if (RobotCom) {
    switch (robotMode) {
      case 1:
        out = "Auto";
        classSet += "badge-warning";
        break;
      case 2:
        out = "Teleop";
        classSet += "badge-warning";
        break;
      case 3:
        out = "Test";
        classSet += "badge-warning";
        break;
      case 0:
        out = "Disable";
        classSet += "badge-success";
        break;
      default:
        out = "Unknow";
        classSet += "badge-secondary";
    }

    if (fmsAtt) {
      out += " FMS";
      classSet = "badge badge-pill badge-info";
    }
  }
  else {
    classSet = "badge badge-pill badge-danger";
    out = "N/A"
  }

  $("#mode-stat").attr('class', classSet);
  $("#mode-stat").html(out);
}

// For the communication status in the top.
function updateCommStat() {
  if (RobotCom) {
    $("#com-stat").attr('class', "badge badge-success badge-pill");
    $("#com-stat").html("Connected");
  } else {
    $("#com-stat").attr('class', "badge badge-warning");
    $("#com-stat").html("Disconnected");
  }
  updateModeStat();
}

// Update the commstatus when robot connect or disconnect.
NetworkTables.addRobotConnectionListener(function (connected) {
  console.log("Robot connected: " + connected);
  RobotCom = connected;
  updateCommStat();
}, true);

// Init ping and ip field.
NetworkTables.putValue("/SmartDashboard/NT/ping", -1);
NetworkTables.putValue("/SmartDashboard/NT/ip", "noConnect");

// Read robot ping.
NetworkTables.addKeyListener("/SmartDashboard/NT/ping", function (key, value, isNew) {
  $("#ptime").html(value);
}, true);

// Read robot ip.
NetworkTables.addKeyListener("/SmartDashboard/NT/ip", function (key, value, isNew) {
  $("#ntip").html(value);
});

NetworkTables.addKeyListener("/SmartDashboard/ds/isFMSAtt", function (key, value, isNew) {
  fmsAtt = value;
  updateModeStat();
}, true);

NetworkTables.addKeyListener("/SmartDashboard/ds/mode", function (key, value, isNew) {
  robotMode = value;
  updateModeStat();
}, true);

NetworkTables.addKeyListener("/SmartDashboard/ds/matchTime", function (key, value, isNew) {
  $("#mtime").html(value);
}, true);

// Connection stuff above
//

// Global listener
NetworkTables.addGlobalListener(function (key, value, isNew) {
  if (key.split('/')[1] == "SmartDashboard" || false) {
    console.log(key, " ", value);
  }
}, true);

//System Info
NetworkTables.addKeyListener("/LiveWindow/Ungrouped/PowerDistributionPanel[1]/Voltage", function (key, value, isNew) {
  setValtBar("battV", value);
  $("#battV").html(value + " V");
}, true);

//Sub system status
NetworkTables.addKeyListener("/SmartDashboard/drive/status", function (key, value, isNew) {
  translateStatus("driveReady", value);
}, true);
NetworkTables.addKeyListener("/SmartDashboard/up/status", function (key, value, isNew) {
  translateStatus("upReady", value);
}, true);
NetworkTables.addKeyListener("/SmartDashboard/shoot/status", function (key, value, isNew) {
  translateStatus("shootReady", value);
}, true);
NetworkTables.addKeyListener("/SmartDashboard/hatch/status", function (key, value, isNew) {
  translateStatus("hatchReady", value);
}, true);
NetworkTables.addKeyListener("/SmartDashboard/SensorHub/status", function (key, value, isNew) {
  translateStatus("sensorReady", value);
}, true);
NetworkTables.addKeyListener("/SmartDashboard/AutoEngine/status", function (key, value, isNew) {
  translateStatus("autoEngingReady", value);
}, true);
NetworkTables.addKeyListener("/SmartDashboard/pdp/status", function (key, value, isNew) {
  translateStatus("pdpReady", value);
}, true);


// Read match data from FSM.
NetworkTables.addKeyListener("/FMSInfo/EventName", function (key, value, isNew) {
  $("#event").html(value);
}, true);

NetworkTables.addKeyListener("/FMSInfo/MatchNumber", function (key, value, isNew) {
  $("#match").html(value);
}, true);

NetworkTables.addKeyListener("/FMSInfo/StationNumber", function (key, value, isNew) {
  $("#station").html(value);
}, true);


//Auto settings
var autoPoint;
var autoChoices;
var delay;

function updateAutoMsg() {
  $("#autoConfig").html("do " + autoChoices + " on " + autoPoint + " delay " + delay);
}

NetworkTables.addKeyListener("/SmartDashboard/autoDelay", function (key, value, isNew) {
  $("#autoDelay").val(value);
  delay = value;
  updateAutoMsg();
}, true);

$("#autoDelay").change(function () {
  if (isNaN($(this).val())) {
    $(this).removeClass("is-valid");
    $(this).addClass("is-invalid");
  }
  else {
    $(this).removeClass("is-invalid");
    $(this).addClass("is-valid");
    NetworkTables.putValue("/SmartDashboard/autoDelay", parseInt($(this).val()));
    setTimeout(function () {
      $("#autoDelay").removeClass("is-valid");
    }, 1000);
  }
});

attachSelectToSendableChooser("#autoChoice", "/SmartDashboard/Auto Choice");
attachSelectToSendableChooser("#autoPosition", "/SmartDashboard/Auto point choices");

NetworkTables.addKeyListener("/SmartDashboard/Auto Choice/selected", function (key, value, isNew) {
  autoChoices = value;
  updateAutoMsg();
}, true);

NetworkTables.addKeyListener("/SmartDashboard/Auto point choices/selected", function (key, value, isNew) {
  autoPoint = value;
  updateAutoMsg();
}, true);

//Auto mode
NetworkTables.addKeyListener("/limelight/tx", function (key, value, isNew) {
  $("#limeTX").html(value);
}, true);

NetworkTables.addKeyListener("/limelight/tv", function (key, value, isNew) {
  $("#limeTV").html(value);
}, true);

NetworkTables.addKeyListener("/SmartDashboard/CurrentStep", function (key, value, isNew) {
  $("#autoStage").html(value);
}, true);

NetworkTables.addKeyListener("/SmartDashboard/AutoTimer", function (key, value, isNew) {
  $("#autoTimer").html(value);
}, true);



// DriveBase
NetworkTables.addKeyListener("/SmartDashboard/drive/leftSpeed", function (key, value, isNew) {
  speedL.set(value);
  $("#speedL").html(value);
}, true);

NetworkTables.addKeyListener("/SmartDashboard/drive/rightSpeed", function (key, value, isNew) {
  speedR.set(value);
  $("#speedR").html(value);
}, true);

NetworkTables.addKeyListener("/SmartDashboard/drive/reverse", function (key, value, isNew) {
  if (value) {
    $("#driveRev").addClass("active");
  }
  else {
    $("#driveRev").removeClass("active");
  }
}, true);

$("#driveRev").click(function () {
  var valKey = "/SmartDashboard/drive/reverse";
  NetworkTables.putValue(valKey, !NetworkTables.getValue(valKey));
});

// Shoot
NetworkTables.addKeyListener("/SmartDashboard/shoot/turnPower", function (key, value, isNew) {
  setPWMBar("turnPowerB", value);
  $("#turnPower").html(value);
}, true);

NetworkTables.addKeyListener("/SmartDashboard/shoot/shootPower", function (key, value, isNew) {
  setPWMBar("shootPowerB", value);
  $("#shootPower").html(value);
}, true);

NetworkTables.addKeyListener("/SmartDashboard/shoot/shootSpeed", function (key, value, isNew) {
  setShootSpeedBar("shootSpeedB", value);
  $("#shootSpeed").html(value);
}, true);

NetworkTables.addKeyListener("/SmartDashboard/shoot/lsw", function (key, value, isNew) {
  if (value) {
    $("#turnLSW").removeClass("badge-secondary");
    $("#turnLSW").addClass("badge-success");
  } else {
    $("#turnLSW").removeClass("badge-success");
    $("#turnLSW").addClass("badge-secondary");
  }
}, true);

NetworkTables.addKeyListener("/SmartDashboard/shoot/rsw", function (key, value, isNew) {
  if (value) {
    $("#turnRSW").removeClass("badge-secondary");
    $("#turnRSW").addClass("badge-success");
  } else {
    $("#turnRSW").removeClass("badge-success");
    $("#turnRSW").addClass("badge-secondary");
  }
}, true);

NetworkTables.addKeyListener("/SmartDashboard/shoot/useLL", function (key, value, isNew) {
  if (value) {
    $("#limeLightOn").removeClass("badge-secondary");
    $("#limeLightOn").addClass("badge-success");
  } else {
    $("#limeLightOn").removeClass("badge-success");
    $("#limeLightOn").addClass("badge-secondary");
  }
}, true);

// SensorHub
NetworkTables.addKeyListener("/SmartDashboard/SensorHub/heading", function (key, value, isNew) {
  compassC.value = value;
  $("#compass").html(value);
}, true);

// Drive Enc
NetworkTables.addKeyListener("/SmartDashboard/drive/leftDis", function (key, value, isNew) {
  $("#lEnc").html(value);
}, true);

NetworkTables.addKeyListener("/SmartDashboard/drive/rightDis", function (key, value, isNew) {
  $("#rEnc").html(value);
}, true);

// Transport

NetworkTables.addKeyListener("/SmartDashboard/transport/power", function (key, value, isNew) {
  setPWMBar("transPowerB", value);
  $("#transPower").html(value);
}, true);

NetworkTables.addKeyListener("/SmartDashboard/transport/dist", function (key, value, isNew) {
  setTransDistBar("transDistB", value);
  $("#transDist").html(value);
}, true);

// Intake

NetworkTables.addKeyListener("/SmartDashboard/intake/power", function (key, value, isNew) {
  setPWMBar("intakePowerB", value);
  $("#intakePower").html(value);
}, true);

NetworkTables.addKeyListener("/SmartDashboard/intake/sol", function (key, value, isNew) {
  $("#intakeSOL").removeClass("badge-light");
  $("#intakeSOL").removeClass("badge-success");
  $("#intakeSOL").removeClass("badge-warning");
  if (value === 1) {
    $("#intakeSOL").html("forw.");
    $("#intakeSOL").addClass("badge-success");
  } else if (value === 2) {
    $("#intakeSOL").html("rev.");
    $("#intakeSOL").addClass("badge-warning");
  } else if (value === 0) {
    $("#intakeSOL").html("off");
    $("#intakeSOL").addClass("badge-light");
  }
}, true);

// Climb

NetworkTables.addKeyListener("/SmartDashboard/climb/power", function (key, value, isNew) {
  setPWMBar("climbPowerB", value);
  $("#climbPower").html(value);
}, true);

NetworkTables.addKeyListener("/SmartDashboard/climb/sw", function (key, value, isNew) {
  if (value) {
    $("#climbSW").removeClass("badge-secondary");
    $("#climbSW").addClass("badge-success");
  } else {
    $("#climbSW").removeClass("badge-success");
    $("#climbSW").addClass("badge-secondary");
  }
}, true);

//Pneumatic Assembly

NetworkTables.addKeyListener("/SmartDashboard/pneumatic/compPower", function (key, value, isNew) {
  setONOFF("compPower", value);
}, true);

NetworkTables.addKeyListener("/SmartDashboard/pneumatic/compCloseLoop", function (key, value, isNew) {
  if (value) {
    $("#compCloseLoop").addClass("active");
  }
  else {
    $("#compCloseLoop").removeClass("active");
  }
}, true);

$("#compCloseLoop").click(function () {
  var valKey = "/SmartDashboard/pneumatic/compCloseLoop";
  NetworkTables.putValue(valKey, !NetworkTables.getValue(valKey));
});


// Camera
var cam1URL = "10.60.83.11";
var cam2URL = "10.60.83.2";
var cam3URL = "10.60.83.2";

$("#cam1IP").html(cam1URL);
$("#cam2IP").html(cam2URL);
$("#cam3IP").html(cam3URL);

$("#cam1Load").click(function () {
  $(this).hide();
  loadCameraOnConnect({
    container: '#cam1',
    port: 5800,
    host: cam1URL,
    image_url: '/',
    data_url: '/css/common.css',
    attrs: {
      width: 320,
      height: 240
    }
  });
});

$("#cam2Load").click(function () {
  $(this).hide();
  loadCameraOnConnect({
    container: '#cam2',
    port: 1181,
    host: cam2URL,
    image_url: '/stream.mjpg',
    data_url: '/settings.json',
    attrs: {
      width: 320,
      height: 240
    }
  });
});

$("#cam3Load").click(function () {
  $(this).hide();
  loadCameraOnConnect({
    container: '#cam3',
    port: 1181,
    host: cam2URL,
    image_url: '/stream.mjpg',
    data_url: '/settings.json',
    attrs: {
      width: 320,
      height: 240
    }
  });
});

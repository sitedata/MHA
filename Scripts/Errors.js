/* global StackTrace */
/* exported CleanStack */
/* exported parseError */

function getErrorMessage(error) {
    if (!error) return '';
    if (Object.prototype.toString.call(error) === "[object String]") return error;
    if (error.message) return error.message;
    if (error.description) return error.description;
    return JSON.stringify(error, null, 2);
}

function getErrorStack(error) {
    if (!error) return '';
    if (Object.prototype.toString.call(error) === "[object String]") return "string thrown as error";
    if (error.stack) return error.stack;
    return '';
}

// error - an exception object
// message - a string describing the error
// errorHandler - function to call with parsed error
function parseError(exception, message, errorHandler) {
    var stack;
    var exceptionMessage = getErrorMessage(exception);

    var eventName = joinArray([message, exceptionMessage], ' : ');
    if (!eventName) {
        eventName = "Unknown exception";
    }

    var callback = function (stackframes) {
        stack = FilterStack(stackframes).map(function (sf) {
            return sf.toString();
        });
        errorHandler(eventName, stack);
    };

    var errback = function (err) {
        stack = [getErrorStack(exception), "Parsing error:", getErrorMessage(err), getErrorStack(err)];
        errorHandler(eventName, stack);
    };

    if (!exception || Object.prototype.toString.call(exception) === "[object String]") {
        StackTrace.get().then(callback).catch(errback);
    } else {
        StackTrace.fromError(exception).then(callback).catch(errback);
    }
}

// Join an array with char, dropping empty/missing entries
function joinArray(array, char) {
    if (!array) return null;
    return (array.filter(function (item) { return item; })).join(char);
}

function FilterStack(stack) {
    return stack.filter(function (item) {
        if (!item.fileName) return true;
        if (item.fileName.indexOf("stacktrace") !== -1) return false;
        if (item.functionName === "ShowError") return false;
        if (item.functionName === "showError") return false;
        if (item.functionName === "LogError") return false;
        if (item.functionName === "GetStack") return false;
        if (item.functionName === "parseError") return false;
        return true;
    });
}

// Strip stack of rows with unittests.html.
// Only used for unit tests.
function CleanStack(stack) {
    return stack.map(function (item) {
        return item.replace(/.*localhost.*/g, "").replace(/.*azurewebsites.*/g, "").replace(/\n+/g, "\n");
    }).filter(function (item) {
        return !!item;
    });
}
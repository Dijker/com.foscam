function onHomeyReady (Homey) {

    Homey.get('mail_host', (err, mail_host) => {
        if (mail_host) { $('#host').val(mail_host); }
    });

    Homey.get('mail_port', (err, mail_port) => {
        if (mail_port) { $('#port').val(mail_port); }
    });

    Homey.get('mail_username', (err, mail_username) => {
        if (mail_username) { $('#username').val(mail_username); }
    });

    Homey.get('mail_password', (err, mail_password) => {
        if (mail_password) { $('#password').val(mail_password); }
    });

    Homey.get('mail_from', (err, mail_from) => {
        if (mail_from) { $('#from').val(mail_from); }
    });

    Homey.get('mail_recipient', (err, mail_recipient) => {
        if (mail_recipient) { $('#recipient').val(mail_recipient); }
    });

    Homey.get('mail_send_as', (err, mail_send_as) => {
        if (mail_send_as) { $('#sendAs').val(mail_send_as); }
    });

    Homey.ready();
}

$(document).on('focus', 'input, select', function () {
    $('#save').html(__('save')).removeAttr('disabled');
    $(this).parent().removeClass('invalid');
});

$(document).on('click', '#save', function (e) {

    var $this = $(this);

    $this.html(__('loading-spinner')).prop('disabled', 'disabled');

    if (!validateForm()) {
        $this.html(__('save')).removeAttr('disabled');
        return false;
    }

    let settings = {
        host: $('#host').val(),
        port: Number($('#port').val()),
        from: $('#from').val(),
        username: $('#username').val(),
        password: $('#password').val(),
        recipient: $('#recipient').val(),
        sendas: $('#sendAs').val()
    };

    Homey.api('PUT', '/verify_email_settings', settings, (err, result) => {
        if (err) {
            Homey.alert(err.message, 'error');
            $this.html(__('save')).removeAttr('disabled');
        } else {

            Homey.set('mail_host', settings.host);
            Homey.set('mail_port', settings.port);
            Homey.set('mail_username', settings.username);
            Homey.set('mail_password', settings.password);
            Homey.set('mail_from', settings.from);
            Homey.set('mail_recipient', settings.recipient);
            Homey.set('mail_send_as', settings.sendas);

            $this.html(__('saved')).prop('disabled', 'disabled');
        }
    });

});

$(document).on('click', '#deleteLogs', function (e) {

    var $this = $(this);

    $this.html(__('loading-spinner')).prop('disabled', 'disabled');

    Homey.confirm(__('settings.tab2.warning'), 'warning', (err, result) => {
        if (result) {
            Homey.api('GET', 'delete_logs/', null, (err) => {
                if (err) {
                    Homey.alert(err.message, 'error');
                } else {
                    updateLogs();
                }
            });
        }

        $this.html(__('settings.tab2.delete')).removeAttr('disabled');
    });

});

function showTab (tab) {

    if (tab === 2) {
        updateLogs();
    }

    $('.panel').hide();
    $('.tab-active').removeClass('tab-active').addClass('tab-inactive');
    $('#tabb' + tab).removeClass('tab-inactive').addClass('tab-active');
    $('#tab' + tab).show();
}

function validateForm () {

    let error = false;

    $('.invalid').removeClass('invalid');

    if ($('#host').val().length === 0) {
        $('#host').parent().addClass('invalid');
        error = true;
    }

    if ($('#port').val().length === 0) {
        $('#port').parent().addClass('invalid');
        error = true;
    }

    if ($('#from').val().length === 0) {
        $('#from').parent().addClass('invalid');
        error = true;
    }

    if ($('#recipient').val().length === 0) {
        $('#recipient').parent().addClass('invalid');
        error = true;
    }

    if (error) {
        return false;
    }

    return true;
}

function displayLogs (lines) {
    $('#loglines').html(lines);
}

function updateLogs () {

    $('#loglines').html('<div style="font-size:16px;text-align:center;width:100%;"> ' + __('loading-spinner') + '</div>');

    Homey.api('GET', '/logs', null, (err, result) => {
        if (err) {
            displayLogs(err);
        } else {
            let lines = '';

            for (let i = (result.length - 1); i >= 0; i -= 1) {
                lines += `${result[i]}<br />`;
            }

            displayLogs(lines);
        }
    });

}
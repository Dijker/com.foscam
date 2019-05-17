function onHomeyReady (Homey) {
    Homey.get('host', (err, host) => {
        if (host) { $('#host').val(host); }
    });

    Homey.get('port', (err, port) => {
        if (port) { $('#port').val(port); }
    });

    Homey.get('username', (err, username) => {
        if (username) { $('#username').val(username); }
    });

    Homey.get('password', (err, password) => {
        if (password) { $('#password').val(password); }
    });

    Homey.get('from', (err, from) => {
        if (from) { $('#from').val(from); }
    });

    Homey.get('recipient', (err, recipient) => {
        if (recipient) { $('#recipient').val(recipient); }
    });

    Homey.get('after_snapshot', (err, after_snapshot) => {
        if (after_snapshot) {
            $('#mailAfterSnapshot').val(after_snapshot);
        } else {
            $('#mailAfterSnapshot').val(0);
        }
    });

    Homey.get('send_as', (err, send_as) => {
        if (send_as) { $('#sendAs').val(send_as); }
    });

    Homey.ready();
}

$(document).on('focus', 'input, select', function () {
    $('#save').html(__('save')).removeAttr('disabled');
    $(this).parent().removeClass('invalid');
});

$(document).on('click', '#save', function (e) {
    var $this = $(this);

    $('.invalid').removeClass('invalid');

    $this.html(__('loading-spinner')).prop('disabled', 'disabled');

    if ($('#mailAfterSnapshot').val() === '1') {
        if (!validateForm()) {
            $this.html(__('save')).removeAttr('disabled');
            return false;
        }
    }

    let settings = {
        host: $('#host').val(),
        port: Number($('#port').val()),
        from: $('#from').val(),
        username: $('#username').val(),
        password: $('#password').val(),
        recipient: $('#recipient').val(),
        emailafter: $('#mailAfterSnapshot').val(),
        sendas: $('#sendAs').val()
    };

    if ($('#mailAfterSnapshot').val() === '1') {
        Homey.api('PUT', '/verify_email_settings', settings, (err, result) => {
            if (err) {
                Homey.alert(err.message, 'error');
                $this.html(__('save')).removeAttr('disabled');
            } else {

                Homey.set('host', settings.host);
                Homey.set('port', settings.port);
                Homey.set('username', settings.username);
                Homey.set('password', settings.password);
                Homey.set('from', settings.from);
                Homey.set('recipient', settings.recipient);
                Homey.set('after_snapshot', settings.emailafter);
                Homey.set('send_as', settings.sendas);

                $this.html(__('saved')).prop('disabled', 'disabled');
            }
        });
    } else {
        Homey.set('host', settings.host);
        Homey.set('port', settings.port);
        Homey.set('username', settings.username);
        Homey.set('password', settings.password);
        Homey.set('from', settings.from);
        Homey.set('recipient', settings.recipient);
        Homey.set('after_snapshot', settings.emailafter);
        Homey.set('send_as', settings.sendas);

        $this.html(__('saved')).prop('disabled', 'disabled');
    }

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
require('requirish')._(module);
require('should');
var mtproto = require('lib/mtproto');
var auth = require('lib/auth');
var message = require('lib/message');
var net = require("lib/net");
var tl = require('telegram-tl-node');


describe('EncryptedRpcChannel', function() {

    var tcpConn;
    var port = 3005;
    var SendCode = new tl.TypeBuilder('namespace', {
        "id": "1988976461",
        "method": "auth.sendCode",
        "params": [{
            "name": "phone_number",
            "type": "string"
        }, {
            "name": "sms_type",
            "type": "int"
        }, {
            "name": "api_id",
            "type": "int"
        }, {
            "name": "api_hash",
            "type": "string"
        }, {
            "name": "lang_code",
            "type": "string"
        }],
        "type": "auth.SentCode"
    }).getType();

    var sendCode = new SendCode({
        props: {
            phone_number: '003934987654321',
            sms_type: 5,
            api_id: 10534,
            api_hash: '844584f2b1fd2daecee726166dcc1ef8',
            lang_code: 'it'
        }
    });

    var authKey = new auth.AuthKey(
        new Buffer('4efd920588a83ac9', 'hex'),
        new Buffer('33843a2caeb2452873c89349fd8f7221ba734c8df5e05c122a9e36b036995afc81057270b71b6375ae1ccf59514519748bbb0ec508dde9d17bce70e3dcf685b3731917b144710233f0d4b6a1d69b37722eaa075c5aeabde8d1848ef04af661055f52ab406ab7df8dec44a7ddcbf9de5be36ace00ecfbf5cb69b156c18a469e70658b99ecc2d1ff8de47cf573589b475833016a327f855965b7f541a9926651e50e4dcea69ebb5adbe2cc6ad49b36d38c6058c9f1fff06b07688ccb129e20aef00d77912a2f61cb82274fa86d0aa24b58c9e12cad8c751c6da2831ec635d053bd99b26a6fc83a28c64ff5c94efb5ef82356783c6f2ca0b55a074de82de553c6cb', 'hex')
    );

    before(function() {
        require('./tcp-server').start(port);
        tcpConn = new net.TcpConnection({host: "0.0.0.0", port: port});
        tcpConn.connect();
    });

    describe('#init()', function() {
        it('should notify error back ', function(done) {
            try {
                new net.EncryptedRpcChannel();
            } catch (err) {
                done();
            }
        })
    });

    describe('#init()', function() {
        it('should notify error back ', function(done) {
            try {
                new net.EncryptedRpcChannel(new net.TcpConnection({host: "0.0.0.0", port: port}));
            } catch (err) {
                done();
            }
        })
    });

    describe('#init()', function() {
        it('should create an instance', function() {
            var rpcChannel = new net.EncryptedRpcChannel(tcpConn, authKey, '0x77907373a54aba77', '0xfce2ec8fa401b366');
            rpcChannel.should.be.ok;
            rpcChannel.should.have.properties({
                _connection: tcpConn,
                _authKey: authKey,
                _sessionId: '0x77907373a54aba77',
                _serverSalt: '0xfce2ec8fa401b366'
            });
            rpcChannel.isOpen().should.be.true;
        })
    });

    describe('#close()', function() {
        it('should close the channel', function() {
            var rpcChannel = new net.EncryptedRpcChannel(tcpConn);
            rpcChannel.should.be.ok;
            rpcChannel.close();
            rpcChannel.isOpen().should.be.false;
        })
    });

    describe('#close()', function() {
        it('should call the method', function(done) {

            net.EncryptedRpcChannel.prototype._deserializeResponse = function (response) {
                return new message.EncryptedMessage({buffer: response, authKey: this._authKey}).deserialize(true).body;
            };
            var rpcChannel = new net.EncryptedRpcChannel(tcpConn, authKey, '0x77907373a54aba77', '0xfce2ec8fa401b366');

            rpcChannel.callMethod(sendCode, 0, function(ex, resObj, duration) {
                if (ex) {
                    console.log(ex);
                }
                resObj.should.be.ok;
                resObj.should.have.properties({
                    phone_number: '003934987654321',
                    sms_type: 5,
                    api_id: 10534,
                    api_hash: '844584f2b1fd2daecee726166dcc1ef8',
                    lang_code: 'it'
                });

                console.log('calling the method takes %sms', duration);
                done();

            });
        })
    });

    after(function() {
        tcpConn.close();
        require('./tcp-server').shutdown(port);
    });
});

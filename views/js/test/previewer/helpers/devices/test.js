/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'lodash',
    'taoQtiTestPreviewer/previewer/helpers/devices',
    'json!taoQtiTestPreviewer/test/previewer/helpers/devices/mock-devices-refined.json'
], function(_, devicesHelper, refineDevicesList) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', function(assert) {
        assert.expect(1);
        assert.equal(typeof devicesHelper, 'object', 'The module exposes an object');
    });

    QUnit.cases.init([
        {title: 'getDevicesByType'},
        {title: 'getMobileDevices'},
        {title: 'getDesktopDevices'}
    ]).test('helper is defined ', function(data, assert) {
        assert.expect(1);
        assert.equal(typeof devicesHelper[data.title], 'function', 'The helper ' + data.title + ' is defined');
    });

    QUnit.module('Behavior');

    QUnit.test('getDevicesByType', function(assert) {
        assert.expect(4);
        assert.deepEqual(devicesHelper.getDevicesByType(), [], 'Without parameter, the helper returns an empty list');
        assert.deepEqual(devicesHelper.getDevicesByType('standard'), [], 'Without an unknown parameter, the helper returns an empty list');
        assert.deepEqual(devicesHelper.getDevicesByType('mobile'), refineDevicesList.mobile, 'With the expected parameter, the helper returns the list of mobiles');
        assert.deepEqual(devicesHelper.getDevicesByType('desktop'), refineDevicesList.desktop, 'With the expected parameter, the helper returns the list of desktops');
    });

    QUnit.test('getMobileDevices', function(assert) {
        assert.expect(1);
        assert.deepEqual(devicesHelper.getMobileDevices(), refineDevicesList.mobile, 'The helper returns the list of mobiles');
    });

    QUnit.test('getDesktopDevices', function(assert) {
        assert.expect(1);
        assert.deepEqual(devicesHelper.getDesktopDevices(), refineDevicesList.desktop, 'The helper returns the list of desktops');
    });
});

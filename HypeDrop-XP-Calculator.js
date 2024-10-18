// ==UserScript==
// @name         HypeDrop XP Calculator
// @namespace    HypeDrop XP Calculator
// @version      1.0.0
// @description  Script calculates the XP needed for next and/or requested level and displays daily earnings based on level
// @author       Jaxx
// @supportURL   https://discord.com/users/922843169480122388/
// @match        https://www.hypedrop.com/en/player/*/summary
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hypedrop.com
// @grant        none
// @run-at       document-start
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @license      WTFPL
// ==/UserScript==
/* global $ */

(function() {
    'use strict';
    let lvlarray = [];
    let desired_level = 0;
    const earnings_levels = [2, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const earnings_amounts = [0.01, 0.01, 0.05, 0.15, 0.24, 0.31 ,0.60, 1.85, 4.70, 15.00, 39.00];

    fetch("https://raw.githubusercontent.com/its-Jaxx/HypeDrop-XP-Calculator/main/lvl_experience.json")
        .then(response => response.json())
        .then(data => {
            lvlarray = Object.values(data.Levels).map(level => level.experience_points);
        })
        .catch(error => {
            console.error('Error fetching the level experience data:', error);
        });

    const codes = ["JAXX", "JAXX", "JAXX"];
    let rand = 0;
    let code = codes[rand];

    setInterval(() => {
        rand = (rand + 1) % codes.length;
        code = codes[rand];
    }, 8000);

    function calc() {
        let input_data = document.getElementById("xpcalc-level");
        if (input_data) {
            input_data.addEventListener("input", function() {
                desired_level = parseInt(input_data.value) || 0;
            });
        }
    }

    setInterval(() => {
        const xp_bar = document.querySelectorAll(".xp-text");
        const profile = document.querySelectorAll(".profile");
        if (xp_bar.length === 0 || profile.length === 0) {
            return;
        }
        let result = [];
        for (let i = 0; i < xp_bar.length; i++) {
            result.push(xp_bar[i].textContent);
        }

        let xp_text = String(result[0]);
        let matches = xp_text.match(/(\d+).*?(\d+)/);
        if (matches == null) {
            return;
        }
        const xp_current = parseInt(matches[1]);

        let lvl = 0;
        for (let i = 0; i < lvlarray.length; i++) {
            if (xp_current >= lvlarray[i]) {
                lvl++;
            }
        }
        const total_wagered = xp_current / 400;
        let xp_fornext = lvlarray[lvl] - xp_current;
        let wager_fornext = (lvlarray[lvl] / 400) - total_wagered;
        wager_fornext = Math.round(wager_fornext * 100) / 100;
        let percent = (100 * (lvlarray[lvl] - xp_current)) / (lvlarray[lvl] - lvlarray[lvl - 1]);
        percent = 100 - (Math.round(percent * 100) / 100);
        percent = Math.round(percent * 100) / 100;

        let xp_fordesired = lvlarray[desired_level - 1];
        let wager_fordesired = xp_fordesired / 400;

        let xp_needed = xp_fordesired - xp_current;
        let wager_needed = wager_fordesired - total_wagered;
        if (xp_needed < 0) {
            wager_needed = "Reached!";
            xp_needed = "Reached!";
        }

        let daily_earning = 0;
        for (let i = 0; i < earnings_levels.length; i++) {
            if (lvl >= earnings_levels[i]) {
                daily_earning += earnings_amounts[i];
            }
        }

        let desired_daily_earning = 0;
        if (desired_level > 0) {
            for (let i = 0; i < earnings_levels.length; i++) {
                if (desired_level >= earnings_levels[i]) {
                    desired_daily_earning += earnings_amounts[i];
                }
            }
        }

        const case_cost = 0.13;

        const outcomes = [
            { net_loss: 0.12, probability: 0.599998 },
            { net_loss: -0.12, probability: 0.39825 },
            { net_loss: -1.17, probability: 0.0009 },
            { net_loss: -3.87, probability: 0.00045 },
            { net_loss: -12.87, probability: 0.0003 },
            { net_loss: -14.87, probability: 0.0001 },
            { net_loss: -99.87, probability: 0.000001 },
            { net_loss: -249.87, probability: 0.000001 }
        ];

        let expected_net_loss = 0;
        let expected_credits_lost_for_xp = 0;
        for (let outcome of outcomes) {
            expected_net_loss += outcome.net_loss * outcome.probability;
            if (outcome.net_loss > 0) {
                expected_credits_lost_for_xp += outcome.net_loss * outcome.probability;
            }
        }

        const xp_per_0_01_credit_lost = 4;
        const expected_xp_per_case = (expected_credits_lost_for_xp / 0.01) * xp_per_0_01_credit_lost;

        let cases_fornext = xp_fornext / expected_xp_per_case;
        cases_fornext = Math.ceil(cases_fornext);
        let cost_fornext = cases_fornext * expected_net_loss;

        let cases_needed, cost_needed;
        if (xp_needed !== "Reached!") {
            cases_needed = xp_needed / expected_xp_per_case;
            cases_needed = Math.ceil(cases_needed);
            cost_needed = cases_needed * expected_net_loss;
        } else {
            cases_needed = "Reached!";
            cost_needed = "Reached!";
        }

        let xpcalc = document.getElementById("xpcalc-net");
        if (!xpcalc) {
            xpcalc = document.createElement("div");
            xpcalc.classList.add("xpcalc-net-div", "card", "card-body");
            xpcalc.id = "xpcalc-net";
            xpcalc.style.cssText = "display: flex;flex-direction: row;gap: 2rem;flex-wrap: wrap;";
            profile[0].append(xpcalc);
            xpcalc.innerHTML = `
                <div id="xpcalc-level-input"></div>
                <div id="xpcalc-level-info" style="justify-content: space-around;flex-wrap: wrap; min-width: 80%; display: flex;flex-direction: row;gap: 2rem;align-items: center;font-weight: 600;font-size: .8rem;text-transform: uppercase; color: #767b83;"></div>`;
        }
        let dl_color = "#a8dadc";
        let l_color = "#a8dadc";
        if (desired_level >= 121) {
            dl_color = `<font style="color:#240046;">${desired_level}</font>`;
        } else if (desired_level >= 110) {
            dl_color = `<font style="color:#052bed;">${desired_level}</font>`;
        } else if (desired_level >= 100) {
            dl_color = `<font style="color:#660207;">${desired_level}</font>`;
        } else if (desired_level >= 90) {
            dl_color = `<font style="color:#d4ac0d;">${desired_level}</font>`;
        } else if (desired_level >= 80) {
            dl_color = `<font style="color:#f1c40f;">${desired_level}</font>`;
        } else if (desired_level >= 70) {
            dl_color = `<font style="color:#f48c06;">${desired_level}</font>`;
        } else if (desired_level >= 50) {
            dl_color = `<font style="color:#e76f51;">${desired_level}</font>`;
        } else if (desired_level >= 40) {
            dl_color = `<font style="color:#f4a261;">${desired_level}</font>`;
        } else if (desired_level >= 30) {
            dl_color = `<font style="color:#40916c;">${desired_level}</font>`;
        } else if (desired_level >= 20) {
            dl_color = `<font style="color:#52b788;">${desired_level}</font>`;
        } else if (desired_level >= 10) {
            dl_color = `<font style="color:#74c69d;">${desired_level}</font>`;
        } else if (desired_level >= 2) {
            dl_color = `<font style="color:#a8dadc;">${desired_level}</font>`;
        }

        if (lvl >= 121) {
            l_color = "#240046";
        } else if (lvl >= 110) {
            l_color = "#052bed";
        } else if (lvl >= 100) {
            l_color = "#660207";
        } else if (lvl >= 90) {
            l_color = "#d4ac0d";
        } else if (lvl >= 80) {
            l_color = "#f1c40f";
        } else if (lvl >= 70) {
            l_color = "#f48c06";
        } else if (lvl >= 60) {
            l_color = "#f77f00";
        } else if (lvl >= 50) {
            l_color = "#e76f51";
        } else if (lvl >= 40) {
            l_color = "#f4a261";
        } else if (lvl >= 30) {
            l_color = "#40916c";
        } else if (lvl >= 20) {
            l_color = "#52b788";
        } else if (lvl >= 10) {
            l_color = "#74c69d";
        } else if (lvl >= 2) {
            l_color = "#a8dadc";
        }

        let xpcalc_info = document.getElementById("xpcalc-level-info");
        let text = `
            <div style="min-width: 30%;">
                <table style="width: 100%;border-collapse: collapse;">
                    <tr style="border-bottom: 2px solid #ffffff33;">
                        <td>Lvl: </td><td style="color: ${l_color};">${lvl}</td>
                    </tr>
                    <tr>
                        <td>Your current XP: </td>
                        <td style="color: #bcbebf;">${xp_current.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td>Total wagered: </td>
                        <td style="color: #bcbebf;">${total_wagered.toLocaleString()} credits</td>
                    </tr>
                    <tr>
                        <td>Daily Earning: </td>
                        <td style="color: #bcbebf;">${daily_earning.toLocaleString()} EUR</td>
                    </tr>
                    <tr>
                    <td>Monthly Earning: </td>
                    <td style="color: #bcbebf;">${(daily_earning * 30).toLocaleString()} EUR</td>
                    </tr>
                    <tr>
                        <td>XP needed for next level: </td>
                        <td style="color: #bcbebf;">${xp_fornext.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td>Wager for next: </td>
                        <td style="color: #bcbebf;">${wager_fornext.toLocaleString()} credits</td>
                    </tr>
                    <tr>
                        <td>Case strat for next:</td>
                        <td style="color: #bcbebf;">Open ${cases_fornext.toLocaleString()} cases (Expected net loss: ${cost_fornext.toFixed(2)} credits)</td>
                    </tr>
                </table>
            </div>`;

        xpcalc_info.innerHTML = text;
        if (desired_level > 0 && desired_level < 121) {
            let desired_level_text = `
                <div style="min-width: 30%;">
                    <table style="width: 100%;border-collapse: collapse;">
                        <tr>
                            <td>Total XP needed for lvl ${dl_color}: </td>
                            <td style="color: #bcbebf;">${xp_fordesired.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td>Total wager needed for lvl ${dl_color}: </td>
                            <td style="color: #bcbebf;">${wager_fordesired.toLocaleString()} credits</td>
                        </tr>
                        <tr>
                            <td>Daily Earning at lvl ${dl_color}: </td>
                            <td style="color: #bcbebf;">${desired_daily_earning.toLocaleString()} EUR</td>
                        </tr>
                        <tr>
                        <td>Monthly Earning at lvl ${dl_color}: </td>
                        <td style="color: #bcbebf;">${(desired_daily_earning * 30).toLocaleString()} EUR</td>
                        </tr>
                        <tr>
                            <td><br>Remaining XP needed for lvl ${dl_color}: </td>
                            <td style="color: #bcbebf;"><br>${xp_needed.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td>Remaining wager needed for lvl ${dl_color}: </td>
                            <td style="color: #bcbebf;">${wager_needed.toLocaleString()} credits</td>
                        </tr>
                        <tr>
                            <td>Case strat for desired:</td>
                            <td style="color: #bcbebf;">Open ${cases_needed} cases (Expected net loss: ${cost_needed === "Reached!" ? "Reached!" : cost_needed.toFixed(2) + " credits"})</td>
                        </tr>
                    </table>
                </div>`;
            xpcalc_info.innerHTML += desired_level_text;
        }

        xpcalc_info.innerHTML += `
            <div style="display:flex; flex-direction: column; gap: .7rem; align-items: center;">
                <div id="progress" style="text-align: center;font-size: .7rem;border-radius: 10px;padding: 1rem; width: 100%;background: linear-gradient(90deg, ${l_color} ${percent}%, rgba(30,33,39,1) ${percent}%); color: #fff;text-shadow: 1px 1px 6px black;">
                    Progress to ${lvl + 1} level: ${xp_current.toLocaleString()} / ${lvlarray[lvl].toLocaleString()} - ${percent}%<br>Need to wager ${wager_fornext.toLocaleString()} credits more
                </div>
                <div style="margin-top: 10px;font-size:1rem;color:#fff;">
                    USE CODE <input type="text" value="${code}" readonly style="text-align: center;font-weight: 600;border:none!important; background-color: #1f2643;color: #0ec514;width:8ch;"> for +5% deposit bonus
                </div>
            </div>`;

        let xpcalc_input = document.getElementById("xpcalc-level");
        let xpcalc_level_input = document.getElementById("xpcalc-level-input");
        if (!xpcalc_input) {
            xpcalc_level_input.innerHTML = `
                <input type="number" id="xpcalc-level" style="background: #1c2342;color: #fff;border: 1px #000 !important;padding: 0.8rem;border-radius: 10px;">
                <div style="position: absolute;top: 10px;background: #1c2342;">Desired level</div>`;
        }
        calc();
    }, 2000);

})();

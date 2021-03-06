import { Component, OnInit, ViewChild } from "@angular/core";
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NbaApiService } from "../../nba-api.service";

@Component({
    selector: "app-team-schedule",
    templateUrl: "team-schedule.component.html",
    styleUrls: ['team-schedule.component.scss']
})
export class TeamScheduleComponent implements OnInit {
    
    @ViewChild('instance', { static: true }) instance: NgbTypeahead;
    public focus$ = new Subject<string>();
    public click$ = new Subject<string>();
    public schedule: Observable<any>;
    public teams: string[] = ['hawks', 'celtics', 'nets', 'hornets', 'bulls', 'cavaliers', 'mavericks', 'nuggets', 'pistons', 'warriors',
    'rockets', 'pacers', 'clippers', 'lakers', 'grizzlies', 'heat', 'bucks', 'timberwolves', 'pelicans', 'knicks', 'thunder', 'magic', 'sixers',
    'suns', 'blazers', 'kings', 'spurs', 'raptors', 'jazz', 'wizards'].sort();
    public timelineForm = this.fb.group({
        selectedTeam: [''],
        season:[],
    });

    constructor(
        private nbaapiservice: NbaApiService,
        private fb: FormBuilder,
        private _snackBar: MatSnackBar) { }
    

    search = (text$: Observable<string>) => {
        const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
        const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance.isPopupOpen()));
        const inputFocus$ = this.focus$;

        return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
            map(term => (term === '' ? this.teams
                : this.teams.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)).slice(0, 5))
        );
    }

    displayWhichTeam(team, season){
        let message_team = team.replace(/^./, team[0].toUpperCase());
        let message_season = season + '-' + (Number(season) + 1) + ' season';
        this._snackBar.open(message_team, message_season, {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
        });

    }

    onSubmit() {
        let t = this.timelineForm.controls['selectedTeam'].value;
        let s = this.timelineForm.controls['season'].value;
        this.postTeamSchedule(t, s);
        
        this.displayWhichTeam(t,s);

        this.timelineForm.reset();
    }

    getGameDate(d : string, time: string){
        let game_date = d.replace(/(\d{4})(\d{2})(\d{2})/g, '$1-$2-$3');
        
        var full_date = new Date(game_date).toUTCString();
        full_date = full_date.substring(0, full_date.indexOf(' 00'))

        if (time != "") {
            let game_time = time.replace(/(\d{2})(\d{2})/g, '$1:$2');
            full_date = full_date + " at " + game_time;
        }
        return full_date
    }

    postTeamSchedule(team: string, year: number) {
        this.nbaapiservice.getTeamSchedule(team, year).subscribe(
            (res) => {
                this.schedule = res
                // console.log(res)
            });
    }

    topBtnFunction() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }

    jumpToTop() {
        var topbutton = document.getElementById("topBtn");
        // When the user scrolls down 1000px from the top of the document, show the button
        window.onscroll = function () {
            if (document.body.scrollTop > 1000 || document.documentElement.scrollTop > 1000) {
                topbutton.style.display = "block";
            } else {
                topbutton.style.display = "none";
            }
        };
    }

    ngOnInit() {
        this.jumpToTop();
        let team= 'raptors';
        let season = 2018;
        this.displayWhichTeam(team, season)
        this.postTeamSchedule(team, season);
    }
}


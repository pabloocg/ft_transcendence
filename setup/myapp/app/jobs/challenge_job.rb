class ChallengeJob < ApplicationJob
  queue_as :default

  def perform(player, other)

    search = true
    if (challenge = Matchmaking.where(challenge: [player.id, other.id]).exists?)
        search = false
    else
        Matchmaking.create!(user: player, match_type: 'challenge', challenge: [player.id, other.id])
        puts "Created match"
    end

    loop do
        Matchmaking.uncached do 
            if !Matchmaking.where(user_id: player.id).exists?
                search = false
            end
        end

        if !search
            break
        end

        # Stop searching if player have a current match
        if have_match = Match.where(left_player: player.id, finished: false).or(Match.where(right_player: player.id, finished: false)).first
            ActionCable.server.broadcast( "Matchmaking_#{player.id}", { action: 'current_game' , match: have_match.id } )
            break
        end

            # opponent found!
        if opponent = Matchmaking.where(challenge: [other.id, player.id]).first

            player1 = player.as_json(only: [:id, :nickname, :avatar, :score])
            player2 = opponent.user.as_json(only: [:id, :nickname, :avatar, :score])
            l_player, r_player = [player, opponent.user].shuffle
            match = Match.create!(match_type: "challenge game", left_player_id: l_player.id, right_player_id: r_player.id)
            ActionCable.server.broadcast( "Matchmaking_#{player.id}", { action: 'game_found' , player1: player1, player2: player2, match: match.id } )
            ActionCable.server.broadcast( "Matchmaking_#{opponent.user_id}", { action: 'game_found' , player1: player2, player2: player1, match: match.id } )
            Matchmaking.destroy_by(user_id: opponent.id)
            break
        else
            # searching action is sent
            ActionCable.server.broadcast( "Matchmaking_#{player.id}", { action: 'searching' } )
            sleep 7
        end
    end
    Matchmaking.destroy_by(user_id: player.id)
end
end
